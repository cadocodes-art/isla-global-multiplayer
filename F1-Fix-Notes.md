ISLA V2.42 - F1 ACCELERATION FIX

The F1 was limited by tire traction on the ground, but used much greater
uncapped acceleration in the air and on elevated Maker roads. A short
nitro burst could end before reaching top speed; a bump could then cause
a sudden surge.

- The F1 now has a consistent nitro acceleration curve on terrain, in
  the air, on Maker roads and while water skimming.
- On a level road from rest, level 1 reaches its displayed 550 km/h
  within one shortest five-second nitro burst.
- Level 2 stays at 688 km/h maximum; level 3 stays at 825 km/h maximum.
- Time to 99% of maximum is about 4.5, 4.75 and 5 seconds respectively,
  comparable to the Vespera at the same upgrade level. Slopes, impacts
  and steering can still change your speed naturally.
- Acceleration does not depend on remaining nitro duration. Taking off
  cannot unlock a stronger burst near the end of the tank.
- Releasing nitro, braking and running out of charge stop its boost.
- F1 upgrade nitro duration/refill also applies on elevated Maker roads.
- Existing cars and their handling, prices and upgrades are preserved.
- The recent Grappler fixes remain, including the 10-second limit and
  five-second cooldown. Existing saves and online settings are retained.

Validation: real physics at 30/60/120 Hz, all three F1 upgrade levels,
ground/air/Maker road parity, takeoff and landing, short/long bursts,
braking, water, offline split-screen independence and other-car regressions.
