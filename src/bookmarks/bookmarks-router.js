const express = require('express')
const { isWebURi } = require('valid-url')
const xss = require('xss')
const logger = require('../logger')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating),
})

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description = 'none', rating } = req.body;
        // const newBookmark = { title, url, description, rating }

        // for (const [key, value] of Object.entries(newBookmark)) {
        //     if (value == null) {
        //         return res.status(400).json({
        //             error: { message: `Missing '${key}' in request body` }
        //         })
        //     }
        // }

        const ratingNum = Number(rating)

        if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send({
                error: { message: `'rating' must be a number between 0 and 5` }
            })
        }

        // if (!isWebURi(url)) {
        //     logger.error(`Invlalid url '${url}' supplied `)
        //     return res.status(400).send({
        //         error: { message: `'url' must be a valid url`}
        //     })
        // }

        const newBookmark = { title, url, description, rating }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created`)
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarksRouter
    .route('/bookmarks/:bookmark_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { bookmark_id } = req.params
        BookmarksService.getById(knexInstance, bookmark_id)
            .then(bookmark => {
                //make sure we found a bookmark
                if (!bookmark) {
                    logger.error(`Bookmark with id ${bookmark_id} not found.`);
                    return res.status(404).json({
                        error: { message: `Bookmark Not Found` }
                    })
                }
                res.bookmark = bookmark //save the bookmark for the next middleware
                next() //call next so the next middleware happens
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.bookmark.id,
            title: xss(res.bookmark.title), //sanitize title
            url: xss(res.bookmark.url), //sanitize url
            description: xss(res.bookmark.description), //sanitize description
            rating: res.bookmark.rating,
        })
    })
    .delete((req, res, next) => {
        const { bookmark_id } = req.params
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(() => {
                logger.info(`Bookmark with id ${bookmark_id} deleted.`)
                res.status(204).end()
            })
            .catch(next)
    })


module.exports = bookmarksRouter