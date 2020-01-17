# Triage Action

Automatically label and comment to an issue.

### Usage

See [action.yml](./action.yml) For comprehensive list of options.
 
Basic:

```yaml
name: "Triage Issue"
on:
  issues:
    types: [opened]

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
    - uses: DeMoorJasper/triage-bot@master
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```
