Place Arabic font files here so PDF receipts render correctly.

Supported families (use any one):
- Cairo: Cairo-Regular.ttf, Cairo-Bold.ttf
- Noto Naskh Arabic: NotoNaskhArabic-Regular.ttf, NotoNaskhArabic-Bold.ttf
- Amiri: Amiri-Regular.ttf, Amiri-Bold.ttf

Instructions:
1) Copy the .ttf files into this folder with exact filenames above.
2) Restart the dev server so the PDF generator can register the fonts.
3) Generate a new receipt to verify Arabic text and the ﷼ symbol.

Note: If no font is present, the app falls back to a generic font and Arabic will look broken. In that case the currency label will show as "ر.س" instead of the Riyal symbol.
