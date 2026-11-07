// Account-only rankings. Visibility filters are applied before ranks are calculated.
export function installLeaderboard(h){h.db.exec('CREATE TABLE IF NOT EXISTS v23_profile_ranks(account TEXT PRIMARY KEY,show_ranks INTEGER NOT NULL DEFAULT 1)');}
const base=`WITH star_counts AS (
 SELECT owner,COUNT(*) AS stars FROM maps WHERE approved=1 AND published IS NOT NULL AND deleted=0 AND hidden=0 GROUP BY owner
), stats AS (
 SELECT a.id,a.username,a.mood,a.created,a.show_aura AS showAura,
 CASE WHEN json_extract(a.garage,'$.showIscoins')=0 THEN 0 ELSE 1 END AS showIscoins,
 MAX(0,MIN(1000000000000,CAST(COALESCE(json_extract(a.garage,'$.earned'),0) AS INTEGER))) AS aura,
 MAX(0,MIN(1000000000000,CAST(COALESCE(json_extract(a.garage,'$.iscoins'),0) AS INTEGER))) AS iscoins,
 COALESCE(s.stars,0) AS stars FROM accounts a LEFT JOIN star_counts s ON s.owner=a.id WHERE a.verified=1
)`;
const categories={aura:'showAura',iscoins:'showIscoins',stars:'1'};
function query(category){
 const visible=categories[category],eligible=visible+(category==='stars'?' AND score>0':'');
 return base+`, scores AS (SELECT *,${category} AS score FROM stats), ranked AS (
 SELECT *,RANK() OVER (ORDER BY score DESC) AS globalRank FROM scores WHERE ${eligible}
), peers AS (
 SELECT s.*,r.globalRank FROM scores s LEFT JOIN ranked r ON r.id=s.id
 WHERE s.id=? OR EXISTS (SELECT 1 FROM friendships f WHERE f.status='accepted' AND ((f.first=? AND f.second=s.id) OR (f.second=? AND f.first=s.id))
 AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.account=? AND b.target=s.id) OR (b.target=? AND b.account=s.id)))
), friend_ranked AS (
 SELECT id,RANK() OVER (ORDER BY score DESC) AS friendRank FROM peers WHERE ${eligible}
), friends_board AS (
 SELECT p.id,p.username,p.mood,p.score,p.globalRank,f.friendRank FROM peers p LEFT JOIN friend_ranked f ON f.id=p.id WHERE ${visible}
)`;
}
export function leaderboard(h,viewer,url){
 const category=url.searchParams.get('category')||'aura',scope=url.searchParams.get('scope')||'top',rawPage=url.searchParams.get('page')||'0';
 if(!Object.hasOwn(categories,category)||!['top','friends'].includes(scope)||!/^\d{1,6}$/.test(rawPage))throw Object.assign(Error('Choose a valid leaderboard category and tab.'),{status:400});
 const sql=query(category),args=Array(5).fill(viewer.id),visible=categories[category],source=scope==='top'?'ranked':'friends_board';
 const total=h.count(sql+` SELECT COUNT(*) AS n FROM ${source}`,...args),pages=scope==='top'?1:Math.max(1,Math.ceil(total/100)),page=Math.min(Number(rawPage),pages-1);
 const items=scope==='top'?h.rows(sql+' SELECT r.id,r.username,r.mood,r.score,r.globalRank,f.friendRank FROM ranked r LEFT JOIN friend_ranked f ON f.id=r.id ORDER BY r.score DESC,r.username COLLATE NOCASE,r.id LIMIT 100',...args):h.rows(sql+' SELECT * FROM friends_board ORDER BY score DESC,username COLLATE NOCASE,id LIMIT 100 OFFSET ?',...args,page*100);
 const me=h.one(sql+` SELECT p.id,p.username,p.mood,CASE WHEN ${visible} THEN p.score ELSE NULL END AS score,p.globalRank,f.friendRank,CASE WHEN ${visible} THEN 0 ELSE 1 END AS excluded FROM peers p LEFT JOIN friend_ranked f ON f.id=p.id WHERE p.id=?`,...args,viewer.id);
 return {category,scope,items,me:{...me,excluded:!!me.excluded},total,pages,page};
}
export function profileRanks(h,user,viewer){
 const showRanks=h.one('SELECT show_ranks FROM v23_profile_ranks WHERE account=?',user.id)?.show_ranks!==0;
 if(!showRanks||!viewer)return {showRanks,ranks:null};
 const ranks={};
 for(const category of Object.keys(categories)){
  const visible=categories[category];
  const row=h.one(base+`, ranked AS (SELECT id,RANK() OVER (ORDER BY ${category} DESC) AS rank FROM stats WHERE ${visible}${category==='stars'?' AND stars>0':''}) SELECT rank FROM ranked WHERE id=?`,user.id);
  ranks[category]=row?.rank??null;
 }
 return {showRanks,ranks};
}
