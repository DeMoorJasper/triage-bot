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
    - uses: DeMoorJasper/triage-action@v1
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        stale-message: 'The secret used to interact with the github api.'
```
