-- remove-images.lua
-- This Pandoc Lua filter removes every Image element from the document,
-- but leaves code blocks (and anything else) completely intact.

function Image(el)
    return {}    -- returning an empty list drops the image node
  end