# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Post-push iOS delivery

The user requests this workflow after every successful push in this repository:

1. Run `eas build --platform ios` and wait for the build to succeed.
2. Run `eas submit --platform ios`, selecting the exact successful build from step 1 (use its build ID when supported).
3. Report the build and submission results, including their links when available.

This workflow is already authorized; do not ask for routine confirmation again. If the build fails, do not submit an older build. If authentication or required credentials block either step, report the blocker and request only the missing user action. Submission does not authorize a separate App Store review or public release action.
