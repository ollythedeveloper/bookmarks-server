const path = require('path')
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
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`'${field}' is required`)
                return res.status(400).send({
                    error: { message: `'${field}' is required` }
                })
            }
        }

        const { title, url, description, rating } = req.body;

        const ratingNum = Number(rating)

        if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
            logger.error(`Invalid rating '${rating}' supplied`)
            return res.status(400).send({
                error: { message: `'rating' must be a number between 0 and 5` }
            })
        }

        // if (!isWebUri(url)) {
        //     logger.error(`Invalid url '${url}' supplied`)
        //     return res.status(400).send({
        //       error: { message: `'url' must be a valid URL` }
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
                    .location(path.posix.join(req.originalUrl, `${bookmark.id}`))
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:bookmark_id')
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
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating} = req.body
        const bookmarkToUpdate = { title, url, description, rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
                }
            })
        }

        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })


module.exports = bookmarksRouter