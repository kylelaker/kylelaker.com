function isCharacterAlphabetic(char) {
    return char.toUpperCase() != char.toLowerCase();
}

function mockifyString(toFlip) {
    var flipped = "";
    var upper = true;
    for (var i = 0; i < toFlip.length; i++) {
        let currentChar = toFlip.charAt(i);
        if (isCharacterAlphabetic(currentChar)) {
            if (upper) {
                flipped += currentChar.toUpperCase();
            } else {
                flipped += currentChar.toLowerCase();
            }
            upper = !upper;
        } else {
            flipped += currentChar;
        }
    }
    return flipped;
}
