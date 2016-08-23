import fetch from 'isomorphic-fetch'
import { receiveFilterOptions, setInitialLoadComplete, setAppIsLoading, setCollapsedBulk } from './app'
import { receiveQuestions, receiveQuestionsById } from './questions'
import { receiveResponseIdMap, setResponsesPendingBulk, receiveResponses } from './responses'
import { setScoresBulk } from './scores'
import { setVotesBulk } from './votes'

export const REQUEST_PROBLEM = 'REQUEST_PROBLEM';
const requestProblem = (problemId) => {
	return {
		type: REQUEST_PROBLEM,
		problemId
	}
}

export const RECEIVE_PROBLEM = 'RECEIVE_PROBLEM';
const receiveProblem = (problemId, problem) => {
	const { ID, title, content } = problem
	return {
		type: RECEIVE_PROBLEM,
		payload: {
			ID,
			title,
			content
		}
	}
}

export const REQUEST_PROBLEMS = 'REQUEST_PROBLEMS';
const requestProblems = (problems) => {
	return {
		type: REQUEST_PROBLEMS,
		payload: problems
	}
}

export const RECEIVE_PROBLEMS = 'RECEIVE_PROBLEMS'
const receiveProblems = (problems) => {
	return {
		type: RECEIVE_PROBLEMS,
		payload: problems
	}
}

export function fetchProblem( problemId ) {
	return (dispatch, getState) => {
		// Reset a bunch of stuff.
		// Could work around this with a better-structured state (store all data per-problem)
		dispatch( setInitialLoadComplete( false ) )
		dispatch( receiveProblems( {} ) )
		dispatch( receiveQuestionsById( [] ) )
		dispatch( receiveResponseIdMap( {} ) )

		const { rest_api_endpoint, rest_api_nonce } = window.WWData

		let endpoint = rest_api_endpoint + 'problems/?problem_id=' + problemId
		const { currentFilters, queryString } = getState()
		const { post_data_key } = queryString

		if ( post_data_key ) {
			endpoint += '&post_data_key=' + post_data_key
		}

		endpoint += '&orderby=' + currentFilters.orderby

		return fetch( endpoint,
		{
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': rest_api_nonce
			},
		} )
		.then( response => response.json() )
		.then( json => {
			const {
				problems, questions, questionsById,
				responseIdMap, responses, scores, votes,
				filterOptions
			} = json

			let score = 0;
			let vote = 0;

			dispatch( receiveProblems( problems ) )

			dispatch( receiveQuestions( questions ) )

			// Set "pending" status for response forms.
			let pending = {}
			questionsById.forEach( questionId => {
				pending[questionId] = false
			} )
			dispatch( setResponsesPendingBulk( pending ) )

			dispatch( receiveQuestionsById( questionsById ) )

			let toCollapse = []
			for ( var i = 0; i < questionsById.length; i++ ) {
				toCollapse.push( {
					key: questionsById[ i ] + '-problem',
					value: true
				} )
			}

			dispatch( receiveResponseIdMap( responseIdMap ) )
			dispatch( receiveResponses( responses ) )

			dispatch( setScoresBulk( scores ) )
			dispatch( setVotesBulk( votes ) )

			dispatch( receiveFilterOptions( filterOptions ) )

			dispatch( setInitialLoadComplete( true ) )
			dispatch( setAppIsLoading( false ) )
		} )
	}
}
