# Image Watermark Tool

A free online tool to add text or image watermarks to your photos.

[فارسی](README.md) | **English**

## Features

- ✨ **Text Watermark**: Add custom text with full control over size, color, and position
- 🖼️ **Image Watermark**: Add logo or image with size adjustment
- 🎨 **Opacity Control**: Adjust watermark transparency from 0 to 100%
- 📍 **Position Selection**: 9 different positions for watermark placement
- 🔄 **Rotation**: Rotate watermark from -180 to 180 degrees
- 💾 **Save Settings**: Automatically save settings for future use
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop
- 🔒 **Privacy**: All processing happens in your browser, no data uploaded
- 🌐 **RTL Support**: Full right-to-left support for Persian language

## Demo

Try it here: [Live Demo](https://your-username.github.io/water-mark/)

## Quick Start

1. **Upload Image**: Click or drag & drop your image (JPG, PNG, GIF)
2. **Choose Watermark Type**:
   - Text: Enter text, adjust size and color
   - Image: Select logo file and adjust size
3. **Adjust Settings**:
   - Opacity: Set transparency level
   - Position: Choose from 9 positions
   - Rotation: Rotate the watermark
4. **Download**: Click download button to save the watermarked image

## Technologies

- HTML5
- CSS3 (Responsive Design)
- JavaScript (Vanilla)
- Canvas API
- Local Storage API
- Vazirmatn Font (Persian)

## Installation

### Online Use
This application is ready for GitHub Pages deployment.

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/username/water-mark.git
cd water-mark
```

2. Open `index.html` in your browser or use a local server:
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

3. Navigate to `http://localhost:8000`

## GitHub Pages Deployment

1. Create a new repository on GitHub
2. Push files to the repository:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```
3. Go to repository Settings > Pages
4. Set Source to `main` branch
5. Wait a few minutes and access your site at:
   `https://username.github.io/repo/`

## Project Structure

```
water-mark/
│
├── index.html          # Main page
├── README.md          # Persian documentation
├── README_EN.md       # English documentation
├── DEPLOYMENT.md      # Deployment guide (Persian)
├── LICENSE            # MIT License
│
└── assets/
    ├── style.css      # Stylesheet
    └── script.js      # JavaScript logic
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Features

### Client-Side Processing
All image processing happens in your browser. This means:
- 🔒 Your images never leave your device
- ⚡ Fast processing
- 🌐 Works offline after initial load

### Local Storage
Settings are automatically saved in browser's Local Storage and restored on next visit.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Uses [Vazirmatn](https://github.com/rastikerdar/vazirmatn) Persian font
- Inspired by modern UI design patterns

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This tool is completely free and open-source. Enjoy! 🎨

