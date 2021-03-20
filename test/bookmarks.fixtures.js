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

module.exports = {
    makeBookmarksArray,
}