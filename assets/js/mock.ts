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
