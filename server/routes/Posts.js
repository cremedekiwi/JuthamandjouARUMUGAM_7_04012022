const express = require('express')
const router = express.Router() // Permet de faire des routes
const { Posts, Likes } = require('../models')

const { validateToken } = require('../middlewares/AuthMiddleware')
const { uploadImage } = require('../middlewares/UploadMiddleware')

require('dotenv').config() // Pour cacher le token

// Affiche tous les posts
router.get('/', validateToken, async (req, res) => {
	const listOfPosts = await Posts.findAll({ // Cherche tout les posts
		include: [Likes], // Inclus le modèle des Likes
		order: [['id', 'DESC']], // Affiche les posts du plus récent au plus ancien
	})

	// Trouve tout les likes où UserId est celui qui est connecté
	const likedPosts = await Likes.findAll({ where: { UserId: req.user.id } })

	// Envoi listOfPosts et likedPosts
	res.json({ listOfPosts, likedPosts })

})

// Affiche les posts individuellement
router.get('/byId/:id', async (req, res) => {
	const id = req.params.id
	const post = await Posts.findByPk(id) // Récupère le post via la clé primaire id
	res.json(post)
})

// Affiche les posts d'un user
router.get('/byUserId/:id', async (req, res) => {
	const id = req.params.id
	// Cherche tous les posts de l'utilisateur en indiquant son id
	const listOfPosts = await Posts.findAll({
		where: { UserId: id },
		include: [Likes],
		order: [['id', 'DESC']],
	})
	res.json(listOfPosts)
})

// Crée le post (texte et/ou image)
router.post('/', validateToken, uploadImage, async (req, res) => {
	post = req.body // Récupère les données du formulaire : title et postText
	// On affecte username et UserId avec les données de validateToken
	post.username = req.user.username
	post.UserId = req.user.id
	// On vérifie si req.file existe (upload d'image) 
	if(!req.file) {
		post.imageUrl = null
	}
	// Si c'est le cas
	else {
		post.imageUrl = req.file.filename // On affecte imageUrl avec les données de uploadImage
	}
	await Posts.create(post) // Crée le post
	res.json(post) // Envoi la réponse
})	

// Modifie le titre
router.put('/title', validateToken, async (req, res) => {
	const { newTitle, id } = req.body // Récupère newTitle et id du body
	await Posts.update({ title: newTitle }, { where: { id: id } }) // Met à jour newTitle
	res.json(newTitle)
})

// Modifie le corps du texte : même principe
router.put('/postText', validateToken, async (req, res) => {
	const { newText, id } = req.body
	await Posts.update({ postText: newText }, { where: { id: id } })
	res.json(newText)
})

// Supprime
router.delete('/:postId', validateToken, async (req, res) => {
	const postId = req.params.postId
	await Posts.destroy({ // Supprime le post avec postId
		where: {
			id: postId,
		},
	})

	res.json('Supprimé')
})

module.exports.router = router