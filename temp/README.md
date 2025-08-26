# Temp Directory

This directory contains temporary files, logs, and generated content.

## Contents

- **logs/** - Application and error logs
- **profiles/** - Performance profiling data
- **test-results/** - Test execution results
- **bumba-logs/** - Framework-specific logs

## Important

- ALL files in this directory are ignored by git
- Files here can be safely deleted at any time
- Do not store important data here
- Automatically cleaned on deployment

## Cleanup

To clean all temp files:
```bash
rm -rf temp/*
git checkout temp/.gitignore temp/README.md
```