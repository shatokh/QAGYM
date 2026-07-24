# Catalog Media

This directory contains original fictional raster artwork created specifically
for QA Comics Gym.

Rules:

- Files are local clean catalog assets, not remote dependencies.
- Artwork must not copy real comic covers, commercial characters, logos, or
  brand identity.
- Generated covers contain no embedded title text or watermark.
- Comic cover files use stable slug-based names.
- `cover-fallback.png` is the deterministic clean fallback for a null cover
  path.
- Database paths omit the leading slash, for example
  `media/comics/neon-harbor-1.png`.

The initial assets were generated with the built-in OpenAI image generation
tool and visually reviewed for repository use.
