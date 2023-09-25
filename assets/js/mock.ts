const enum Case {
  UPPER,
  LOWER,
}

function isCharacterAlphabetic(char: string): boolean {
  return char.toUpperCase() != char.toLowerCase();
}

function nextCharCase(current: Case): Case {
  return (current + 1) % 2;
}

function mockifyString(toFlip: string): string {
  let charCase = Case.UPPER;
  const convertCase = {
    [Case.UPPER]: String.prototype.toUpperCase,
    [Case.LOWER]: String.prototype.toLowerCase,
  };
  return toFlip.split("").reduce((sum: string, curr: string) => {
    let newChar = curr;
    if (isCharacterAlphabetic(curr)) {
      newChar = convertCase[charCase].call(curr);
      charCase = nextCharCase(charCase);
    }
    return sum + newChar;
  }, "");
}

(function () {
  let inputBox = document.getElementById('input-mock') as HTMLInputElement | null;
  let outputText = document.getElementById('mocked-text') as HTMLInputElement | null;

    function updateMockedText() {
      if (inputBox && outputText) {
        outputText.innerText = mockifyString(inputBox.value);
      }
    }

  if (inputBox && outputText) {
    inputBox.onkeydown = updateMockedText;
    inputBox.onkeyup = updateMockedText;
  }
})();
