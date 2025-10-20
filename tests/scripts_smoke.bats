#!/usr/bin/env bats

setup() {
  # Make all scripts executable before tests
  chmod +x scripts/*.sh 2>/dev/null || true
  chmod +x .specify/scripts/bash/*.sh 2>/dev/null || true
  chmod +x validate.sh 2>/dev/null || true
  # Set up a dummy git user for tests that need it
  git config user.email "test@example.com"
  git config user.name "Test User"
}

teardown() {
    # Clean up test repo if it exists to keep tests idempotent
    rm -rf test-repo
    rm -rf "test dir"
}

@test "validate.sh shows help" {
  run ./validate.sh --help
  [ "$status" -eq 0 ]
  [[ "$output" =~ "Usage" ]]
}

@test "generate-review-patch.sh creates a patch" {
  # Setup a dummy git repo for the test in a subdirectory to avoid conflicts
  mkdir test-repo
  cd test-repo

  # Initialize git and make an initial commit
  git init > /dev/null
  touch initial-file.txt
  git add initial-file.txt
  git commit -m "initial commit" > /dev/null
  echo "new content" > new-file.txt

  # Run the script from the parent directory
  run ../scripts/generate-review-patch.sh 001

  [ "$status" -eq 0 ]
  [[ "$output" =~ "Patch generated successfully!" ]]
  # The script creates the 'reviews' dir in its CWD
  [ -f "reviews/changes-for-review-T001.patch" ]

  # Go back to original directory for teardown
  cd ..
}

@test "update-agent-context.sh handles paths with spaces" {
  # Create a dummy feature directory with a space in the name
  mkdir -p ".specify/specs/test feature"
  touch ".specify/specs/test feature/plan.md"
  export SPECIFY_FEATURE="test feature"

  run .specify/scripts/bash/update-agent-context.sh

  [ "$status" -eq 0 ]
  [[ "$output" =~ "Agent context update completed successfully" ]]

  # Cleanup
  rm -rf ".specify/specs/test feature"
  unset SPECIFY_FEATURE
}

@test "setup-plan.sh handles paths with spaces" {
  # Create a dummy feature directory with a space in the name
  export SPECIFY_FEATURE="test feature"

  run .specify/scripts/bash/setup-plan.sh

  [ "$status" -eq 0 ]
  [ -f ".specify/specs/test feature/plan.md" ]

  # Cleanup
  rm -rf ".specify/specs/test feature"
  unset SPECIFY_FEATURE
}

@test "check-prerequisites.sh handles paths with spaces" {
  # Create a dummy feature directory with a space in the name
  mkdir -p ".specify/specs/test feature"
  touch ".specify/specs/test feature/plan.md"
  export SPECIFY_FEATURE="test feature"

  run .specify/scripts/bash/check-prerequisites.sh

  [ "$status" -eq 0 ]
  [[ "$output" =~ "FEATURE_DIR:.specify/specs/test feature" ]]

  # Cleanup
  rm -rf ".specify/specs/test feature"
  unset SPECIFY_FEATURE
}
