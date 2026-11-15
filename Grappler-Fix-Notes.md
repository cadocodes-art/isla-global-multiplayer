ISLA V2.42 - GRAPPLER FIX

- The car stays upright while attached. Airborne pitch no longer accumulates
  into an upside-down car, and air tricks cannot flip it during a grapple.
- After lift-off, grappling gradually loses about 0.65 meters of height per
  second. It returns to ordinary driving when it touches the ground.
- Reattaching in midair keeps the exact current height, even on a taller
  building. It adds no vertical boost, and the gradual descent continues.
- A fresh hook from the ground still lifts gently by five meters; this is
  only available again after landing, not while chaining between buildings.
- Manual release adds a strong horizontal launch: 1.65 times current speed
  plus 12 m/s, capped at 1.6 times that upgrade's nitro speed. It retains
  the swing direction and does not boost the car upward. Release from a
  standstill simply lets go. Automatic detachment never adds launch speed.
- Nitro does not immediately erase launch momentum in the air. Normal
  speed rules return on landing. Reset clears all grapple/launch state.
- The controls are unchanged: F / GRAPPLE / RELEASE. Works on desktop,
  mobile and each offline split-screen player independently.
- The gray-brown Inferno stones and V2.42 corner-clearing orbits remain.

Validation includes 100-second posture/descent tests at 30/60/120 Hz,
real driving physics, taller-building re-hooks, nitro after launch,
landing, resets and independent split-screen drivers. Existing saves,
upgrades, maps, accounts and owner settings are preserved.
