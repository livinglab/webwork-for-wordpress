import React, { Component } from 'react'
import Scroll, { Element } from 'react-scroll'
import Waypoint from 'react-waypoint'

import ScoreDialogContainer from '../containers/ScoreDialogContainer'
import ResponseList from './ResponseList'
import ResponseFormContainer from '../containers/ResponseFormContainer'
import PreviewableFieldContainer from '../containers/PreviewableFieldContainer'
import FormattedProblem from './FormattedProblem'
import EditSaveButtonContainer from '../containers/EditSaveButtonContainer'

var moment = require( 'moment' )

export default class Question extends Component {
	componentDidMount() {
		const {
			isCurrentQuestion, isSingleProblem,
			itemId, initialLoadComplete, userCanPostResponse
		} = this.props

		if ( ! isSingleProblem ) {
			return
		}

		if ( initialLoadComplete && userCanPostResponse ) {
			const responseScrollElementName = 'response-form-' + itemId
			Scroll.scroller.scrollTo( responseScrollElementName, {
				duration: 1000,
				offset: -80, // for toolbar
				smooth: true
			} )
		}

		if ( isCurrentQuestion ) {
			// Delay to allow LaTeX to render
			setTimeout( function() {
				Scroll.scroller.scrollTo( 'question-' + itemId, {
					duration: 1500,
					smooth: true
				} )
			}, 500 )
		}
	}

	render() {
		const {
			feedback, isCurrentQuestion,
			isCollapsed, isEditing, isPending, isProblemSummaryCollapsed, isSingleProblem,
			itemId, question, questionLink, questionStatus,
			responseIds, responses, userCanEdit, userCanPostResponse,
			onAccordionClick, onDeleteClick, onEditClick, onEditSaveClick,
			onProblemSummaryClick, onRespondClick, onWaypointEnter
		} = this.props

		const {
			tried, content, questionId, authorAvatar, authorName,
			problemText
		} = question

		const isMyQuestion = question.isMyQuestion > 0

		let hasProblemText = false
		if ( problemText && problemText.length > 0 ) {
			hasProblemText = true
		}

		const responseScrollElementName = 'response-form-' + itemId
		const Element = Scroll.Element

		const anchorName = 'question-' + itemId

		let aeClass = 'fa accordion-toggle'
		if ( isCollapsed ) {
			aeClass += ' fa-plus-circle'
		} else {
			aeClass += ' fa-minus-circle'
		}

		const accordionElement = (
			<i
			  aria-hidden="true"
			  className={aeClass}
			></i>
		)

		let statusText = 'Unanswered'
		switch ( questionStatus ) {
			case 'answered' :
				statusText = 'Answered!'
				break;

			case 'in-progress' :
				statusText = 'In-Progress'
				break;
		}

		const questionTitleElement = (
			<a
			  className="ww-question-link"
			  href={questionLink}
			>
				<div className="ww-author-name">A Question from {authorName}</div>
			</a>
		)

		const timestamp = moment( question.postDate ).format( 'MMMM D, YYYY' )

		let feedbackElements = []
		let thisFeedback
		if ( feedback ) {
			for ( var feedbackType in feedback ) {
				feedbackElements.push(
					<div
						key={feedbackType}
						className={'item-feedback item-feedback-' + feedbackType}
					>
						{feedback[ feedbackType ]}
					</div>
				)
			}
		}

		const responseCount = responseIds.length

		let responseCountText
		if ( 1 == responseCount ) {
			responseCountText = '1 Reply'
		} else {
			responseCountText = responseCount + ' Replies'
		}

		let responseCountElements = []
		if ( ! isSingleProblem || isCollapsed ) {
			responseCountElements.push( <span key="response-sep" className="ww-subtitle-sep">|</span> )
			responseCountElements.push(
				<span key="response-value" className="ww-subtitle-section">
					{responseCountText}
				</span>
			)
		}

		const editLinkOnclick = function( e ) {
			e.preventDefault()
			onEditClick()
		}

		const deleteLinkOnclick = function( e ) {
			e.preventDefault()
			if ( window.confirm( 'Are you sure you want to delete this question and all its responses?' ) ) {
				onDeleteClick()
			}
		}

		let editLinkElements = []
		if ( userCanEdit ) {
			editLinkElements.push(
				<span key="editing-sep" className="ww-subtitle-sep">|</span>
			)

			if ( isEditing ) {
				editLinkElements.push(
					<a
						href="#"
						onClick={editLinkOnclick}
						key="edit-link-editing"
						className="ww-edit-link ww-edit-link-editing"
					>
						Editing
						<i className="fa fa-pencil" aria-hidden="true"></i>
					</a>
				)
			} else {
				editLinkElements.push(
					<a
						href="#"
						onClick={editLinkOnclick}
						key="edit-link-edit"
						className="ww-edit-link ww-edit-link-edit"
					>
						Edit
						<i className="fa fa-pencil" aria-hidden="true"></i>
					</a>
				)
			}
		}

		const questionSubtitleElement = (
			<div className="ww-subtitle ww-question-subtitle">
				<span className="ww-subtitle-section">
					Posted {timestamp}
				</span>
				{responseCountElements}
				{editLinkElements}
			</div>
		)

		let questionCourseElement
		if ( ! isSingleProblem ) {
			let courseData = []
			if ( question.problemSet ) {
				courseData.push( question.problemSet );
			}

			if ( question.course ) {
				courseData.push( question.course );
			}

			if ( question.section ) {
				courseData.push( question.section );
			}

			const courseDataString = courseData.join( ' | ' )

			questionCourseElement = (
				<div className="question-course-data">
					{courseDataString}
				</div>
			)
		}

		const questionScoreElement = (
			<ScoreDialogContainer
			  itemId={itemId}
			  itemType='question'
			/>
		)

		let respondLinkElement
		if ( isSingleProblem && userCanPostResponse ) {
			respondLinkElement = (
				<div className="respond-link">
					<a
					  href="#"
					  onClick={ e => {
						  e.preventDefault()
						  this.onGoToResponseFormClick( itemId )
						  onRespondClick()
					  } }
					>
						Reply
					</a>
				</div>
			)
		}


		const questionMetadataElement = (
			<div className="item-metadata">
				{questionCourseElement}
				{respondLinkElement}
				{questionScoreElement}
			</div>
		)

		let problemSummaryClass = 'ww-question-content-section ww-question-problem-summary hide-when-closed'
		if ( isProblemSummaryCollapsed ) {
			problemSummaryClass += ' problem-summary-collapsed'
		}

		const contentId = 'content-' + itemId
		const formattedContent =
			<FormattedProblem
			  itemId={contentId}
			  content={content}
			/>

		const triedId = 'tried-' + itemId
		const formattedTried = (
			<FormattedProblem
			  itemId={triedId}
			  content={tried}
			/>
		)

		let accordionToggleClass = 'fa accordion-toggle'
		if ( isProblemSummaryCollapsed ) {
			accordionToggleClass += ' fa-plus-circle'
		} else {
			accordionToggleClass += ' fa-minus-circle'
		}

		let contentElementsChildren = []
		if ( isEditing ) {
			contentElementsChildren.push(
				<div key="content-editable-children-1" className="editable-field">
					<PreviewableFieldContainer
					  fieldId={'question-' + itemId}
					  fieldName='content'
					  id="ww-question-content"
					  label="My question:"
					/>
				</div>
			)

			contentElementsChildren.push(
				<div key="content-editable-children-2" className="editable-field">
					<PreviewableFieldContainer
					  fieldId={'question-' + itemId}
					  fieldName='tried'
					  id="ww-question-content"
					  label="What I've tried:"
					/>
				</div>
			)

			contentElementsChildren.push(
				<EditSaveButtonContainer
					fieldId={itemId}
					fieldType='question'
					key="content-elements-children-3"
				/>
			)

			contentElementsChildren.push(
				<div className='edit-button-links' key='links'>
					<a href='#' onClick={editLinkOnclick}>Cancel</a>
					<span key="editing-sep" className="ww-subtitle-sep">|</span>
					<a href='#' className="delete-link" onClick={deleteLinkOnclick}>
						Delete
						<div aria-hidden="true" className="delete-notice">
							Delete question and all responses.
						</div>
					</a>
				</div>
			)
		} else {
			let triedElements
			if ( isSingleProblem ) {
				triedElements = (
					<span key="content-elements-children-3">
						<div className="ww-question-content-section-header">What I've tried:</div>
						<div className="ww-question-content-section ww-question-content-text">
							{formattedTried}
						</div>
					</span>
				)
			}

			contentElementsChildren.push( <div key="content-elements-children-1" className="ww-question-content-section-header">My question:</div> )
			contentElementsChildren.push( <div key="content-elements-children-2" className="ww-question-content-section ww-question-content-text">{formattedContent}</div> )
			contentElementsChildren.push( triedElements )
		}

		const contentElements = (
			<div key="contentElements" className="hide-when-closed">
				{contentElementsChildren}
			</div>
		)

		const problemElement = (
			<div
			  className={problemSummaryClass}
			  key="problemElement"
			  onClick={onProblemSummaryClick}
			>
				<div
				  className="ww-my-problem"
				>
					<span
					  className="ww-my-problem-text"
					>
						View My Problem
					</span>
				</div>

				<div
				  className="ww-my-problem-content"
				>
					<FormattedProblem
					  itemId={questionId}
					  content={problemText}
					/>
				</div>
			</div>
		)

		let orderedElements = [ problemElement, contentElements ]

		const questionSummaryElement = (
			<div className="ww-question-content-wrapper">
				<div className="ww-question-content">
					{questionTitleElement}
					{questionSubtitleElement}

					{orderedElements}
				</div>

				<div className="hide-when-closed">
					{questionMetadataElement}
				</div>
			</div>
		)

		let responsesElement
		if ( isSingleProblem ) {
			responsesElement = (
				<div className={isCollapsed ? 'accordion-content accordion-closed' : 'accordion-content accordion-open'}>
					<ResponseList
					  isMyQuestion={isMyQuestion}
					  questionId={itemId}
					  responseIds={responseIds}
					  responses={responses}
					/>
				</div>
			)
		}

		let scrollWaypoint
		if ( ! isSingleProblem ) {
			scrollWaypoint = (
				<Waypoint
					onEnter={onWaypointEnter}
				/>
			)
		}

		return (
			<li
			  className={this.getClassName( isCollapsed, isMyQuestion, questionStatus, isCurrentQuestion )}
			>

				{scrollWaypoint}

				<Element name={anchorName}>
					<a name={anchorName}></a>
				</Element>

				<div className="ww-question">
					<div className="ww-question-header">
						<a
						  href="#"
						  onClick={ e => {
							  e.preventDefault()
							  onAccordionClick( itemId )
						  } }
						>
							{accordionElement}
							<span className="ww-question-header-text">
								{statusText}
							</span>
						</a>

					</div>

					<div className="ww-question-wrapper">
						<div className="ww-author-avatar">
							<img src={authorAvatar} />
						</div>

						<div>
							{questionSummaryElement}
						</div>
					</div>
				</div>

				{responsesElement}
			</li>
		);
	}

	/**
	 * Get a class name for the <li> element.
	 */
	getClassName( isCollapsed, isMyQuestion, questionStatus, isCurrentQuestion ) {
		let classes = []

		if ( isCollapsed ) {
			classes.push( 'question-closed' )
		} else {
			classes.push( 'question-open' )
		}

		if ( isMyQuestion ) {
			classes.push( 'my-question' )
		}

		switch ( questionStatus ) {
			case 'answered' :
				classes.push( 'question-answered' )
				break

			case 'unanswered' :
				classes.push( 'question-unanswered' )
				break

			case 'in-progress' :
				classes.push( 'question-in-progress' )
				break
		}

		if ( isCurrentQuestion ) {
			classes.push( 'current-question' )
		}

		return classes.join( ' ' )
	}

	/**
	 * Scrolling callback for clicking the "Respond" link.
	 *
	 * Not currently aware of state, but maybe it should be - ie to expand the Response form
	 * or flash the form after scroll. At that point, callback should be moved to the
	 * container with associated action/reducer.
	 */
	onGoToResponseFormClick( itemId ) {
		Scroll.scroller.scrollTo( 'response-form-' + itemId, {
			duration: 1000,
			offset: -80, // for toolbar
			smooth: true
		} )
	}
}
