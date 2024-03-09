async function init() {
	await initTheme(parseInt(Cookies.getCookie('themeID'), 10) || 0);
	
	let link = document.createElement('link');
	link.href = 'https://cdn.jsdelivr.net/gh/brandenleong1/utils@latest/themes/transition.css';
	link.rel = 'stylesheet';
	link.type = 'text/css';
	document.head.appendChild(link);

	document.querySelector('#help').onclick = () => {Popup.popup(document.querySelector('#popup-help'))};
	document.querySelector('#settings').onclick = () => {Popup.popup(document.querySelector('#popup-settings'))};
	
	if (Cookies.getCookie('dictionary')) initFromCookie();

	document.querySelector('#upload-file-btn').onchange = function() {
		uploadFile();
	};
}

function initTheme(id = 0) {
	Themes.createThemeCSS(id);
	document.querySelector('#theme-btn').onclick = changeTheme;
	document.querySelector('#theme-btn').themeId = id;
	document.querySelector('#theme-btn').themeLabel1Shown = false;
	document.querySelector('#theme-label-2').innerText = Themes.themes[id][0];
	document.querySelector('#theme-css').setAttribute('href', Themes.themes[id][1]);
	Cookies.setCookie('themeID', id, 5 * 365 * 24 * 60 * 60 * 1000);
}

window.addEventListener('load', async function() {
	await Utils.sleep(100);
	document.querySelector('#loading-css').remove();
	document.querySelector('#loading').style.display = 'none';
	await init();
});