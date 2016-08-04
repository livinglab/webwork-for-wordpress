import fetch from 'isomorphic-fetch'
import { receiveFilterOptions, setAppIsLoading, toggleAccordion } from './app'

export function fetchQuestionIndexList() {
	return (dispatch, getState) => {
		const { rest_api_endpoint, rest_api_nonce } = window.WWData
		let endpoint = rest_api_endpoint + 'questions/'

		const { currentFilters, queryString } = getState()

		let filters = standardizeFiltersForEndpoint( currentFilters )

		let qs = ''
		for ( var filterName in filters ) {
			if ( ! filters.hasOwnProperty( filterName ) ) {
				continue
			}

			if ( '' != qs ) {
				qs += '&'
			}

			qs += filterName + '=' + filters[ filterName ]
		}

		if ( '' != qs ) {
			endpoint += '?' + qs
		}

		dispatch( setAppIsLoading( true ) )

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
			dispatch( receiveFilterOptions( json.filterOptions ) )
			dispatch( receiveQuestions( json.questions ) )
			dispatch( receiveQuestionIds( json.questionIds ) )

			for ( var i = 0; i < json.questionIds.length; i++ ) {
				dispatch( toggleAccordion( json.questionIds[ i ] + '-problem' ) )
			}

			dispatch( setAppIsLoading( false ) )
		} )
	}
}

function standardizeFiltersForEndpoint( filters ) {
	let s = {}

	for ( var filterName in filters ) {
		if ( ! filters.hasOwnProperty( filterName ) ) {
			continue
		}

		switch ( filterName ) {
			case 'problemSet' :
			case 'course' :
			case 'section' :
				if ( filters[ filterName ] ) {
					s[ filterName ] = filters[ filterName ]
				}
			break

			// Can't both be true at once, so don't worry about reconciling.
			case 'answeredQuestions' :
				if ( filters.answeredQuestions ) {
					s.answered = '1'
				}
			break

			case 'unansweredQuestions' :
				if ( filters.unansweredQuestions ) {
					s.answered = '0'
				}
			break;

			default :
				s[ filterName ] = filters[ filterName ]
			break;
		}
	}

	return s
}

export const RECEIVE_QUESTION_IDS = 'RECEIVE_QUESTION_IDS';
const receiveQuestionIds = (questionIds) => {
	return {
		type: RECEIVE_QUESTION_IDS,
		payload: questionIds
	}
}

export const RECEIVE_QUESTION = 'RECEIVE_QUESTION'
const receiveQuestion = (question) => {
	return {
		type: RECEIVE_QUESTION,
		payload: question
	}
}

export const RECEIVE_QUESTIONS = 'RECEIVE_QUESTIONS'
export const receiveQuestions = (questions) => {
	return {
		type: RECEIVE_QUESTIONS,
		payload: questions
	}
}

export const RECEIVE_QUESTION_BY_ID = 'RECEIVE_QUESTION_BY_ID'
const receiveQuestionById = (questionId) => {
	return {
		type: RECEIVE_QUESTION_BY_ID,
		payload: {
			questionId
		}
	}
}

export const RECEIVE_QUESTIONS_BY_ID = 'RECEIVE_QUESTIONS_BY_ID'
export const receiveQuestionsById = (questionsById) => {
	return {
		type: RECEIVE_QUESTIONS_BY_ID,
		payload: questionsById
	}
}

export const CHANGE_QUESTION_TEXT = 'CHANGE_QUESTION_TEXT'
export const changeQuestionText = ( fieldName, value ) => {
	return {
		type: CHANGE_QUESTION_TEXT,
		payload: {
			fieldName,
			value
		}
	}
}

export const SET_QUESTION_PENDING = 'SET_QUESTION_PENDING'
export const setQuestionPending = ( isPending ) => {
	return {
		type: SET_QUESTION_PENDING,
		payload: {
			isPending
		}
	}
}

export function sendQuestion( problemId, content, tried, problemText ) {
	return ( dispatch, getState ) => {
		const { rest_api_endpoint, rest_api_nonce } = window.WWData
		let endpoint = rest_api_endpoint + 'questions/'

		const { queryString } = getState()
		const { post_data_key } = queryString
		if ( post_data_key ) {
			endpoint += '?post_data_key=' + post_data_key
		}

		return fetch( endpoint, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': rest_api_nonce
			},
			body: JSON.stringify({
				problem_id: problemId,
				content,
				problem_text: problemText,
				tried
			})
		} )
		.then( response => response.json() )
		.then( json => {
			dispatch( setQuestionPending( false ) )
			dispatch( receiveQuestion( json ) )
			dispatch( receiveQuestionById( json.questionId ) )
			dispatch( changeQuestionText( 'content', '' ) )
			dispatch( changeQuestionText( 'tried', '' ) )
			// todo - handle errors
		} )
	}
}
