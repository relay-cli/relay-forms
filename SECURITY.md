# Security

## Reporting

Please report a vulnerability privately through GitHub's security advisory form for this repository. Include a minimal reproduction and the affected version.

## Secrets and configuration

Forms often collect tokens and write configuration files. Masked input hides a value on screen but does not protect it in memory or on disk; store secrets with the platform's credential store when one is available, and keep configuration files that contain them readable only by their owner, for example with `editConfig(path, fields, {mode: 0o600})`.
