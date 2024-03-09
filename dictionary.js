// Uses two already sorted lists
function mergeLists(list1, list2, compareFn = (a, b) => a - b, askOverride = false, overrideAll = false) {
	let tempList = [];
	let i = 0; j = 0;
	while (i < list1.length && j < list2.length) {
		let compRes = compareFn(list1[i], list2[j]);
		if (compRes > 0) {
			tempList.push(list2[j]);
			j++;
		} else if (compRes < 0) {
			tempList.push(list1[i]);
			i++;
		} else {
			if (askOverride) {
				if (overrideAll || confirm('Found duplicate definition for "' + list1[i].word + '" (' + list1[i].language + '). Overwrite?')) {
					tempList.push(list2[j]);
				} else {
					tempList.push(list1[i]);
				}
				i++;
				j++;
			} else {
				Popup.toastPopup('Duplicate words!');
				return;
			}
		}
	}

	if (i != list1.length) tempList = tempList.concat(list1.slice(i));
	if (j != list2.length) tempList = tempList.concat(list2.slice(j));

	return tempList;
}

function stringCleanup(string) {
	return string.toLocaleLowerCase().trim();
}

function addWord(word, def, lang, tags = '', desc = '') {
	let entry = {
		word: stringCleanup(word),
		definition: stringCleanup(def),
		language: stringCleanup(lang),
		tags: tags.split(',')
			.map(e => stringCleanup(e))
			.sort((a, b) => a.localeCompare(b)).map(e => e.toLocaleLowerCase()),
		description: desc.trim()
	};
	if (!entry.word.length || !entry.definition.length || !entry.language.length) {
		Popup.toastPopup('One or more blank values');
		return;
	}
	let Dictionary = initToDictionary();
	let index = Utils.binaryInsert(Dictionary, entry, function(a, b) {
		if (a.language.localeCompare(b.language)) return a.language.localeCompare(b.language);
		return a.word.localeCompare(b.word);
	});

	if (index == -1) {
		Popup.toastPopup('Word is already in dictionary');
		return;
	}

	initFromDictionary(Dictionary);
	initToCookie();
	document.querySelector('#popup-add-word').parentNode.click();
}

function deleteTerm(term, noConfirm = false) {
	if (noConfirm || confirm('Delete term "' + term.entry.word + '"?')) {
		term.remove();
		initFromDictionary(initToDictionary());
		initToCookie();
	}
}

function editTerm(term) {
	document.querySelector('#edit-word-word').value = term.entry.word;
	document.querySelector('#edit-word-def').value = term.entry.definition;
	document.querySelector('#edit-word-lang').value = term.entry.language;
	document.querySelector('#edit-word-tags').value = term.entry.tags.join(', ');
	document.querySelector('#edit-word-desc').value = term.entry.description;
	Popup.popup(document.querySelector('#popup-edit-word'));
	document.querySelector('#save-word-btn').onclick = function() {
		confirmEditTerm(term);
	};
}

function confirmEditTerm(oldTerm) {
	let entry = {
		word: stringCleanup(document.querySelector('#edit-word-word').value),
		definition: stringCleanup(document.querySelector('#edit-word-def').value),
		language: stringCleanup(document.querySelector('#edit-word-lang').value),
		tags: document.querySelector('#edit-word-tags').value.split(',')
			.map(e => stringCleanup(e))
			.sort((a, b) => a.localeCompare(b)).map(e => e.toLocaleLowerCase()),
		description: document.querySelector('#edit-word-desc').value.trim()
	};
	if (!entry.word.length || !entry.definition.length || !entry.language.length) {
		Popup.toastPopup('One or more blank values');
		return;
	}
	
	deleteTerm(oldTerm, true);
	let Dictionary = initToDictionary();
	
	let index = Utils.binaryInsert(Dictionary, entry, function(a, b) {
		if (a.language.localeCompare(b.language)) return a.language.localeCompare(b.language);
		return a.word.localeCompare(b.word);
	});

	if (index == -1) {
		Popup.toastPopup('Word is already in dictionary');
		addWord(oldTerm.entry.word, oldTerm.entry.definition, oldTerm.entry.language, oldTerm.entry.tags.join(', '), oldTerm.entry.description);
		if (oldTerm.entry.word != entry.word) {
			document.querySelector('#popup-edit-word').parentNode.click();
			let term = Array.from(document.querySelectorAll('.term')).find(e => e.entry.word == entry.word && e.entry.language == entry.language);
			scrollAndFlashTerm(term);
		}
		return;
	}
	
	initFromDictionary(Dictionary);
	initToCookie();
	document.querySelector('#popup-edit-word').parentNode.click();
}

function clearDict() {
	if (confirm('Caution! You are about to clear a dictionary with ' + document.querySelector('#term-list').children.length + ' item(s).')) {
		Utils.clearDiv(document.querySelector('#term-list'));
		initToCookie();
	}
}

function parseDescription(value) {
	let s = [];
	let get = 0, getTemp = '', getTempLang = '';
	
	for (let i = 0; i < value.length; i++) {
		if (i + 4 < value.length && get == 0 && value.substring(i, i + 5) == '/get(') {
			get = 1;
			i += 4;
			
			let span = document.createElement('span');
			span.innerText = getTemp;
			s.push(span);
			
			getTemp = '', getTempLang = '';
			continue;
		}

		if (get == 1 && value.substring(i, i + 1) == ',') {
			get = 2;
			continue;
		}
		
		if (get == 2 && value.substring(i, i + 1) == ')') {
			get = 0;

			let span = document.createElement('span');
			span.innerText = getTemp;
			span.classList.add('cmd-get', 'button-positive');
			let entry = {word: stringCleanup(getTemp), language: stringCleanup(getTempLang)};
			span.onclick = function() {
				scrollAndFlashTerm(getTermFromEntry(entry));
			}
			Popup.createHoverPopup(entry.language, span);
			s.push(span);
			
			getTemp = '';
			continue;
		}

		if (get != 2) {
			getTemp += value.substring(i, i + 1);
		} else {
			getTempLang += value.substring(i, i + 1);
		}
		
	}

	if (getTemp.length) {
		let span = document.createElement('span');
		span.innerText = (get != 0 ? '/get(' : '') + getTemp + (get == 2 ? ',' + getTempLang : '');
		s.push(span);
	}

	// console.log(s.map(e => e.outerHTML).join(''));
	return s;
}

function createDomTermFromEntry(entry) {
	let term = document.createElement('div');
	term.classList.add('content-container-vertical', 'term');

	let horizontal = document.createElement('div');
	horizontal.classList.add('content-container-horizontal');

	let word = document.createElement('div');
	let wordText = document.createElement('div');
	word.classList.add('term-word');
	wordText.classList.add('content-text');
	wordText.innerText = entry.word;
	word.append(wordText);

	let definition = document.createElement('div');
	let definitionText = document.createElement('div');
	definition.classList.add('term-def');
	definitionText.classList.add('content-text');
	definitionText.innerText = entry.definition;
	definition.append(definitionText);

	let expandBtn = document.createElement('div');
	expandBtn.classList.add('term-expand-btn');
	expandBtn.onmouseenter = function() {
		Animate.transform(expandBtn, {rotateTo: Math.PI / 8, rateFunc: RateFuncs.wiggle, runTime: 100});
	};
	expandBtn.onclick = function() {
		expandTerm(term);
	};

	horizontal.append(word, definition, expandBtn);
	
	let vertical = document.createElement('div');
	vertical.classList.add('content-container-vertical', 'term-dropdown');

	let horizontal2 = document.createElement('div');
	horizontal2.classList.add('content-container-horizontal');
	
	let tags = document.createElement('div');
	tags.classList.add('content-text');
	tags.innerText = '[' + entry.tags.join(', ') + ']';

	let editBtn = document.createElement('div');
	editBtn.classList.add('content-text', 'button-positive');
	editBtn.innerText = 'Edit';
	editBtn.onclick = function() {
		editTerm(term);
	};
	
	let deleteBtn = document.createElement('div');
	deleteBtn.classList.add('content-text', 'button-positive');
	deleteBtn.innerText = 'Delete';
	deleteBtn.onclick = function() {
		deleteTerm(term);
	};

	horizontal2.append(editBtn, deleteBtn);

	let description = document.createElement('div');
	description.classList.add('content-text');
	description.append(...parseDescription(entry.description || 'No description'));

	vertical.append(tags, description, horizontal2);
	
	term.append(horizontal, vertical);

	term.entry = entry;

	return term;
}

function createDomLanguageHeader(language) {
	let header = document.createElement('div');
	header.classList.add('content-header-2', 'language-header');
	header.innerText = language;
	return header;
}

function saveFile() {
	if (!document.querySelectorAll('.term').length) {
		Popup.toastPopup('No terms to download');
		return;
	}

	Utils.saveFile(JSON.stringify(initToDictionary()), 'dictionary_save.txt');
}

function initFromCookie() {
	let Dictionary = JSON.parse(Cookies.getCookie('dictionary'));
	initFromDictionary(Dictionary);
}

function initFromDictionary(Dictionary) {
	let termList = document.querySelector('#term-list');
	Utils.clearDiv(termList);
	for (let i = 0; i < Dictionary.length; i++) {
		if (i == 0 || (i > 0 && Dictionary[i].language != Dictionary[i - 1].language)) {
			termList.append(createDomLanguageHeader(Dictionary[i].language));
		}
		termList.append(createDomTermFromEntry(Dictionary[i]));
	}
}

function initToCookie() {
	let Dictionary = initToDictionary();
	Cookies.setCookie('dictionary', JSON.stringify(Dictionary), 5 * 365 * 24 * 60 * 60 * 1000);
}

function initToDictionary() {
	return Array.from(document.querySelectorAll('.term')).map(e => {
		return {
			word: e.entry.word,
			definition: e.entry.definition,
			language: e.entry.language,
			tags: e.entry.tags,
			description: e.entry.description
		};
	});
}