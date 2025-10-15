# Quick Start Guide - Settings

## What Works NOW (Runtime Controls) ⚡

These settings can be adjusted **right now** while previewing:

### How to Use:
1. Click the **⚙️ Settings** button (top-right corner)
2. Look for the **"⚡ Runtime Controls (Adjustable)"** panel (it has a blue/purple header and border)
3. Adjust the **4 sliders**:

   - **Playback Speed** (0.5x - 2.0x)
     - Move slider to speed up or slow down
     - Changes audio AND animation speed in real-time
   
   - **Transition Speed** (0 - 200ms)
     - 0ms = instant/sharp changes (default)
     - 100ms+ = smooth, fluid transitions
     - Try 100ms for smooth animation!
   
   - **Anticipation Time** (-100ms to +100ms)
     - Negative = mouth moves BEFORE sound
     - Positive = mouth moves AFTER sound
     - Try -30ms to -50ms for better anticipation
   
   - **Min Duration Filter** (0 - 100ms)
     - Filters out very brief mouth movements
     - Try 20-30ms to reduce flicker

4. **IMPORTANT:** Click **"▶ Play Audio"** to see the effects!

## What DOESN'T Work (Info Only) 📚

The other 3 panels are **informational only**:
- 📚 Rhubarb Options (Info Only)
- 📚 Gentle Options (Info Only)  
- 📖 About the Libraries

These show settings used when **creating** the viseme files (not for runtime). They are **disabled** on purpose because they can't be changed after generation.

### To Use These Settings:
You need to regenerate the viseme files using the command-line scripts:

```bash
# For Rhubarb
node lip-sync-libraries/rhubarb/mp3-to-viseme.js audio.mp3 output.json dialog.txt

# For Gentle
node lip-sync-libraries/gentle/gentle-to-viseme.js audio.mp3 transcript.txt output.json
```

See `CONFIGURATION.md` for full details.

## Testing

1. Open `index.html` in your browser
2. Click **⚙️ Settings**
3. The **"⚡ Runtime Controls"** panel should have:
   - Purple/blue gradient header
   - Thicker border
   - Green tip box
   - 4 working sliders

4. Try this:
   - Set **Transition Speed** to 100ms
   - Click **▶ Play Audio**
   - Watch the mouth shapes smoothly blend!

5. Or open `test-settings.html` for a simple slider test

## Troubleshooting

**"The sliders don't move"**
- Refresh the page
- Check browser console (F12) for errors
- Try `test-settings.html` to verify sliders work

**"The sliders move but I don't see changes"**
- Make sure audio is PLAYING (click ▶ Play Audio)
- The settings only affect animation during playback

**"I want to change the disabled dropdowns"**
- Those are info only! They show generation-time settings
- You must regenerate the viseme files to use those
- See CONFIGURATION.md

## Visual Guide

```
Settings Modal:
┌─────────────────────────────────────────┐
│  ⚙️ Animation Settings            [×]   │
├─────────────────────────────────────────┤
│                                         │
│  ╔═════════════════════════════╗       │
│  ║ ⚡ Runtime Controls          ║ ← THIS ONE WORKS!
│  ║                             ║       │
│  ║  [Playback Speed ═══●═══]  ║       │
│  ║  [Transition    ●═══════]  ║       │
│  ║  [Anticipation  ═══●════]  ║       │
│  ║  [Min Duration  ●═══════]  ║       │
│  ╚═════════════════════════════╝       │
│                                         │
│  📚 Rhubarb Options (Info Only)         │
│  ⚠️ These are disabled (info only)     │
│  [Recognizer        ▼] (grayed out)    │
│                                         │
│  📚 Gentle Options (Info Only)          │
│  ⚠️ These are disabled (info only)     │
│  [Conservative      ▼] (grayed out)    │
│                                         │
└─────────────────────────────────────────┘
```

## Quick Demo

1. Open the page
2. Click **⚙️ Settings**
3. Set **Transition Speed** to **150ms**
4. Close settings (click X or outside)
5. Click **▶ Play Audio**
6. Watch both mouths animate smoothly! 🎉

---

**Need more help?** See CONFIGURATION.md for detailed documentation.

