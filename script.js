function clearAddWordPopup() {
	document.querySelector('#add-word-word').value = '';
	document.querySelector('#add-word-def').value = '';
	document.querySelector('#add-word-lang').value = '';
	document.querySelector('#add-word-tags').value = '';
	document.querySelector('#add-word-desc').value = '';
}

function expandTerm(term) {
	if (term.classList.contains('expanded')) {
		term.classList.remove('expanded');
	} else {
		term.classList.add('expanded');
		Animate.fadeIn(term.querySelector('.term-dropdown'), {shiftFrom: UP.scale(0.5), rateFunc: RateFuncs.easeOutCubic});
	}
}

async function scrollAndFlashTerm(term) {
	if (term) {
		term.scrollIntoView({block: 'center'});
		await Utils.sleep(100);
		flashTerm(term);
	}
}

async function flashTerm(term) {
	if (term) {
		term.style.boxShadow = '0 0 10px var(--color_red)';
		await Utils.sleep(750);
		term.style.boxShadow = null;
	}
}

function getTermFromEntry(entry) {
	let a = Array.from(document.querySelectorAll('.term'));
	let idx = Utils.binarySearchIdx(a, entry, function(a, b) {
		if (a.entry.language.localeCompare(b.language)) return a.entry.language.localeCompare(b.language);
		return a.entry.word.localeCompare(b.word);
	});
	if (idx == -1) {
		Popup.toastPopup('Word not found');
		return null;
	} else {
		return a[idx];
	}
}

function filterWords(tags) {
	let c = 0;
	for (let term of Array.from(document.querySelectorAll('.term'))) {
		if (tags.length == 0 || tags.some(tag => Utils.binarySearchIdx(term.entry.tags, tag, function(a, b) {
			return a.localeCompare(b);
		}) != -1)) {
			term.style.display = null;
			c++;
		} else {
			term.style.display = 'none';
		}
	}
	document.querySelector('#filter-results').innerText = c + ' results found.';

	let ch = document.querySelector('#term-list').children;
	let header = null;
	for (let i = 0; i < ch.length; i++) {
		if (ch[i].classList.contains('language-header')) {
			header = ch[i];
			header.style.display = 'none';
		} else if (ch[i].classList.contains('term') && !ch[i].style.display) {
			header.style.display = null;
		}
	}
}

function uploadFile() {
	let fr = new FileReader();
	
	fr.onload = function() {
		try {
			let Dictionary = mergeLists(initToDictionary(), JSON.parse(fr.result), function(a, b) {
				if (a.language.localeCompare(b.language)) return a.language.localeCompare(b.language);
				return a.word.localeCompare(b.word);
			}, true);
			initFromDictionary(Dictionary);
			initToCookie();
		} catch(e) {
			Popup.toastPopup('Invalid file');
		}
	}
	
	fr.readAsText(document.querySelector('#upload-file-btn').files[0]);
}