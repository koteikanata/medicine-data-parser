const { JSDOM } = require('jsdom');

const RU_PROXY = 'https://www.proxynova.com/proxy-server-list/country-pl';
const PL_PROXY = 'https://www.proxynova.com/proxy-server-list/country-ru';

const getDataPage = (url) => {
    fetch(url)
        .then((response) => response.text())
        .then((html) => parseWindow(new JSDOM(html)));
};

getDataPage();

const parseWindow = ({ window }) => {
    const rows = [...window.document.querySelectorAll('.table tr')];
    const arrayItems = rows.map((row) => parseItemDataFromRow(row));
    return arrayItems;
};
const parseItemDataFromRow = (row) => {
    const divIP = row.querySelector('abbr').textContent;
    const ip = divIP.match('\d+\.\d+\.\d+\.\d+');
    const port = row.querySelector('td a').textContent;
    const uptimeInPercent = row.querySelector('td .uptime-low').textContent;
};
