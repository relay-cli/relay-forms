# Relay Forms artwork

The banner and social preview follow the direction of the other Relay repositories: the official Relay mark and the product name on the left, and the real interface drawn as terminal panels on the right.

## Banner

`banner.png` uses a 3:1 composition (2172 × 724). The left side holds the Relay mark, the product name, and a one-line description. The right side shows the three parts of the package as they appear in the terminal: the progress row of a wizard, a single-choice prompt with a disabled option, and an unsaved setting in the configuration editor.

## Social preview

`.github/social-preview.png` recomposes the same panels for a 2:1 thumbnail (1774 × 887). The description is removed and the product name is enlarged so it stays readable in repository cards.

## How it was made

Both images were laid out as HTML with the shared Relay palette (background `#080B0F`, text `#E8EDF2`, muted `#84909C`, blue `#48A8FF`, orange `#FF8A3D`, green `#4FD18B`, yellow `#F0C84B`) and rendered with headless Chrome. The mark is the official one from the Relay organization profile. The panel text is taken from the demonstrations, so the artwork shows what the package actually draws. Avoid decorative code, robots, and generic terminal imagery in future versions.
