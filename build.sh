electron-builder --mac --universal
electron-builder --win --arm64 --x64 --ia32
electron-builder --linux AppImage --x64
electron-builder --linux deb --x64

cd dist

# extract the version part from the filename using a regex
VERSION=$(echo $(ls | grep 'TL App.*\.exe') | sed -E 's/TL App-([0-9]+\.[0-9]+\.[0-9]+)-.*/\1/')

zip -r "TL App-${VERSION}-win-portable.zip" "TL App-${VERSION}.exe"
zip -r "TL App-${VERSION}-linux.zip" *.deb *.AppImage