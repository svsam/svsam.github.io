const list = document.querySelector('#workList');
const search = document.querySelector('#workSearch');
const filter = document.querySelector('#workFilter');
const levelFilter = document.querySelector('#levelFilter');
const count = document.querySelector('#resultCount');

function externalLink(url, label, className = '') {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    link.className = className;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
}

function render(works) {
    const query = search.value.trim().toLocaleLowerCase();
    const mode = filter.value;
    const level = levelFilter.value;
    const matched = works.filter(work => {
        if (mode === 'german' && !work.sourcePdf && !work.additions.length) return false;
        if (mode === 'missing' && (!work.englishUrl || work.sourcePdf || work.additions.length)) return false;
        if (mode === 'added' && !work.additions.length) return false;
        if (level !== 'all' && work.sourceLevel !== level && !work.additions.some(item => item.level === level)) return false;
        const haystack = [work.title, work.year, ...work.additions.flatMap(item => [item.title, item.translator])].join(' ').toLocaleLowerCase();
        return haystack.includes(query);
    });

    list.replaceChildren();
    count.textContent = `${matched.length} of ${works.length} works`;
    if (!matched.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No matching works. Try another search or filter.';
        list.append(empty);
        return;
    }

    for (const section of ['Early works', 'Main works', 'Collaborations and revisions']) {
        const entries = matched.filter(work => work.section === section);
        if (!entries.length) continue;
        const group = document.createElement('section');
        group.className = 'workGroup';
        const heading = document.createElement('h3');
        heading.textContent = section;
        group.append(heading);
        for (const work of entries) {
            const article = document.createElement('article');
            article.className = 'work';
            const year = document.createElement('span');
            year.className = 'workYear';
            year.textContent = work.year;
            const body = document.createElement('div');
            const title = document.createElement('h4');
            title.textContent = work.title;
            body.append(title);
            const links = document.createElement('div');
            links.className = 'translationLinks';
            if (work.englishUrl) links.append(externalLink(work.englishUrl, 'Read English text · H. P. Lovecraft Archive ↗', 'englishText'));
            else if (work.englishStatus === 'lost') {
                const unavailable = document.createElement('span');
                unavailable.className = 'unavailableText';
                unavailable.textContent = 'English text unavailable · work lost';
                links.append(unavailable);
            }
            if (work.sourcePdf && (level === 'all' || work.sourceLevel === level)) {
                links.append(externalLink(work.sourcePdf, `German PDF · original site · ${work.sourceLevel} ↗`, 'sourceTranslation'));
            }
            for (const addition of work.additions) {
                if (level !== 'all' && addition.level !== level) continue;
                const item = document.createElement('div');
                item.className = 'addedTranslation';
                item.append(externalLink(addition.url, `${addition.title} · ${addition.format} · ${addition.level} ↗`));
                const credit = document.createElement('small');
                credit.textContent = ['My addition', addition.translator && `translated by ${addition.translator}`, addition.source].filter(Boolean).join(' · ');
                item.append(credit);
                links.append(item);
            }
            if (links.childElementCount) body.append(links);
            article.append(year, body);
            group.append(article);
        }
        list.append(group);
    }
}

fetch('./catalogue.json')
    .then(response => {
        if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
        return response.json();
    })
    .then(data => {
        render(data.works);
        search.addEventListener('input', () => render(data.works));
        filter.addEventListener('change', () => render(data.works));
        levelFilter.addEventListener('change', () => render(data.works));
    })
    .catch(() => {
        list.textContent = 'The catalogue could not be loaded. Please try again later.';
    });
