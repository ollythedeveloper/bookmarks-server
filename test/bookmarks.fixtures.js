function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'The One',
            url: 'https://wwww.the-one.com/',
            description: 'none',
            rating: 3
        },
        {
            id: 2,
            title: 'Twice Happennings',
            url: 'https://www.2times.com/',
            description: 'where things happen two times',
            rating: 4
        },
        {
            id: 3,
            title: 'Three Times Charm',
            url: 'https://www.threetimes.com/',
            description: 'More than twice is nice',
            rating: 4
        },
    ];
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.badsite.com/',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 4
    }
    const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousBookmark,
        expectedBookmark,
    }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark,
}