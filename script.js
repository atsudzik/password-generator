const passwordOutput = document.querySelector('#passwordOutput');
const copyButton = document.querySelector('#copyButton');
const strengthValue = document.querySelector('#strengthValue');
const strengthBar = document.querySelector('#strengthBar');
const generatorForm = document.querySelector('#generatorForm');
const passwordList = document.querySelector('#passwordList');
const lengthInput = document.querySelector('#length');
const lengthValue = document.querySelector('#lengthValue');
const quantityInput = document.querySelector('#quantity');
const quantityValue = document.querySelector('#quantityValue');
const uppercaseInput = document.querySelector('#uppercase');
const lowercaseInput = document.querySelector('#lowercase');
const numbersInput = document.querySelector('#numbers');
const symbolsInput = document.querySelector('#symbols');
const ambiguousInput = document.querySelector('#ambiguous');

const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
};

const AMBIGUOUS_CHARACTERS = new Set(['i', 'l', '1', 'L', 'o', 'O', '0']);

const setRangeOutput = () => {
  lengthValue.textContent = lengthInput.value;
  quantityValue.textContent = quantityInput.value;
};

setRangeOutput();

[lengthInput, quantityInput].forEach((input) =>
  input.addEventListener('input', setRangeOutput)
);

const getSecureRandomNumber = (max) => {
  if (max <= 0) return 0;
  const cryptoObj = window.crypto || window.msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const array = new Uint32Array(1);
    const maxUint = 0xffffffff;
    const limit = maxUint - ((maxUint + 1) % max);
    let rand;
    do {
      cryptoObj.getRandomValues(array);
      rand = array[0];
    } while (rand > limit);
    return rand % max;
  }
  return Math.floor(Math.random() * max);
};

const buildCharacterPool = () => {
  const includeSets = [];

  if (uppercaseInput.checked) includeSets.push(CHARACTER_SETS.uppercase);
  if (lowercaseInput.checked) includeSets.push(CHARACTER_SETS.lowercase);
  if (numbersInput.checked) includeSets.push(CHARACTER_SETS.numbers);
  if (symbolsInput.checked) includeSets.push(CHARACTER_SETS.symbols);

  if (includeSets.length === 0) {
    throw new Error('Choose at least one character group.');
  }

  let combined = includeSets.join('');

  if (ambiguousInput.checked) {
    combined = [...combined].filter((char) => !AMBIGUOUS_CHARACTERS.has(char)).join('');
  }

  const uniqueCombined = Array.from(new Set(combined.split(''))).join('');

  const requiredCharacters = includeSets.map((set) => {
    let availableChars = set;
    if (ambiguousInput.checked) {
      availableChars = [...set].filter((char) => !AMBIGUOUS_CHARACTERS.has(char)).join('');
    }
    if (!availableChars) {
      return '';
    }
    return availableChars[getSecureRandomNumber(availableChars.length)];
  });

  return { pool: uniqueCombined, requiredCharacters };
};

const shuffleCharacters = (characters) => {
  const array = [...characters];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = getSecureRandomNumber(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
};

const generatePassword = (length) => {
  const { pool, requiredCharacters } = buildCharacterPool();

  if (pool.length === 0) {
    throw new Error('No characters available.');
  }

  const passwordCharacters = [...requiredCharacters];

  for (let i = passwordCharacters.length; i < length; i += 1) {
    const randomChar = pool[getSecureRandomNumber(pool.length)];
    passwordCharacters.push(randomChar);
  }

  return shuffleCharacters(passwordCharacters).slice(0, length);
};

const evaluateStrength = (password) => {
  if (!password) {
    return { label: 'Waiting...', score: 0, width: 10, color: 'var(--warning)' };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let label = 'Weak';
  let color = 'var(--danger)';
  let width = 30;

  if (score <= 3) {
    label = 'Weak';
    color = 'var(--danger)';
    width = 30;
  } else if (score <= 5) {
    label = 'Okay';
    color = 'var(--warning)';
    width = 55;
  } else if (score === 6) {
    label = 'Strong';
    color = 'var(--accent)';
    width = 80;
  } else {
    label = 'Elite';
    color = 'var(--success)';
    width = 100;
  }

  return { label, score, width, color };
};

const renderPasswordList = (passwords) => {
  passwordList.innerHTML = '';

  passwords.forEach((password, index) => {
    const card = document.createElement('div');
    card.className = 'password-card';
    card.innerHTML = `
      <span class="password-card__index">${String(index + 1).padStart(2, '0')}</span>
      <span class="password-card__value">${password}</span>
      <button type="button" class="password-card__copy" aria-label="Copy password ${index + 1}">📄</button>
    `;
    const button = card.querySelector('button');
    button.addEventListener('click', () => copyToClipboard(password, button));
    passwordList.appendChild(card);
  });
};

const fallbackCopy = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'absolute';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.appendChild(textArea);
  textArea.select();
  const successful = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!successful) {
    throw new Error('Fallback copy failed');
  }
};

const copyToClipboard = async (text, element = copyButton) => {
  const isPrimaryButton = element.classList.contains('btn');

  if (isPrimaryButton && !element.dataset.originalHtml) {
    element.dataset.originalHtml = element.innerHTML;
  }

  if (!isPrimaryButton && !element.dataset.originalText) {
    element.dataset.originalText = element.textContent;
  }

  const showCopiedState = () => {
    if (isPrimaryButton) {
      element.classList.add('is-copied');
      element.innerHTML = '<span class="btn__icon" aria-hidden="true">✔</span><span class="btn__text">Copied!</span>';
    } else {
      element.classList.add('is-copied');
      element.textContent = 'Copied!';
    }
  };

  const resetState = () => {
    if (isPrimaryButton) {
      element.innerHTML = element.dataset.originalHtml;
      element.classList.remove('is-copied');
    } else {
      element.textContent = element.dataset.originalText;
      element.classList.remove('is-copied');
    }
  };

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopy(text);
    }

    showCopiedState();
    element.disabled = true;

    setTimeout(() => {
      resetState();
      element.disabled = false;
    }, 1600);
  } catch (error) {
    console.error('Copy failed', error);
  }
};

copyButton.addEventListener('click', () => {
  const password = passwordOutput.value;
  if (password) {
    copyToClipboard(password, copyButton);
  }
});

const handleGenerate = (event) => {
  event.preventDefault();

  const length = Number(lengthInput.value);
  const quantity = Number(quantityInput.value);

  try {
    const passwords = Array.from({ length: quantity }, () => generatePassword(length));
    const [primaryPassword] = passwords;
    passwordOutput.value = primaryPassword;

    const { label, width, color } = evaluateStrength(primaryPassword);
    strengthValue.textContent = label;
    strengthBar.style.width = `${width}%`;
    strengthBar.style.background = color;

    renderPasswordList(passwords);
  } catch (error) {
    strengthValue.textContent = 'Check settings';
    strengthBar.style.width = '10%';
    strengthBar.style.background = 'var(--danger)';
    passwordOutput.value = error.message;
    passwordList.innerHTML = '<p class=\"password-list__placeholder\">Adjust your settings to generate a password.</p>';
  }
};

generatorForm.addEventListener('submit', handleGenerate);

// Generate a default password on first load
passwordOutput.value = 'Click generate to begin';
strengthValue.textContent = 'Waiting...';
strengthBar.style.width = '15%';
strengthBar.style.background = 'var(--warning)';
