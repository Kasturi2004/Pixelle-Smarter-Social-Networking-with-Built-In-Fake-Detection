# ML Service Notes

This service uses a lightweight rule-based scorer instead of a large model so it is easy to demo and explain in a classroom or presentation.

Inputs:

- `numberOfPosts`
- `followerFollowingRatio`
- `accountAgeDays`
- `activityLevel`

Output:

- `riskScore` from `0` to `1`
- `isFake` boolean based on a `0.62` threshold

