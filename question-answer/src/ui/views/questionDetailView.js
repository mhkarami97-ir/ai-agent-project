/**
 * Question Detail View
 */
import { createElement, clearElement, $ } from '../../core/dom.js';
import { QuestionService } from '../../domain/services/questionService.js';
import { AnswerService } from '../../domain/services/answerService.js';
import { UserService } from '../../domain/services/userService.js';
import { VoteRepository } from '../../data/repositories/voteRepository.js';
import { createVoteButtons } from '../components/voteButtons.js';
import { formatDate } from '../../core/utils.js';
import { toast } from '../../core/toast.js';
import { handleAsync, getErrorMessage } from '../../core/error.js';
import { ValidationError } from '../../core/validation.js';

export class QuestionDetailView {
    constructor(container) {
        this.container = container;
        this.questionService = new QuestionService();
        this.answerService = new AnswerService();
        this.userService = new UserService();
        this.voteRepo = new VoteRepository();
        this.currentUser = null;
        this.question = null;
        this.answers = [];
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    async render(questionId) {
        clearElement(this.container);

        // Show loading
        const loading = createElement('div', { className: 'loading' }, 'در حال بارگذاری...');
        this.container.appendChild(loading);

        const result = await handleAsync(() => 
            this.questionService.getQuestionById(questionId)
        );

        clearElement(this.container);

        if (result.isFail() || !result.data) {
            toast.error('سوال یافت نشد');
            this.container.appendChild(createElement('div', { className: 'empty-state' }, 'سوال یافت نشد'));
            return;
        }

        this.question = result.data.question;
        this.answers = result.data.answers;

        // Load author
        const authorResult = await handleAsync(() => 
            this.userService.getUserById(this.question.authorId)
        );
        const author = authorResult.isOk() ? authorResult.data : null;

        // Load answer authors
        const answerAuthorsMap = await this.loadAnswerAuthors(this.answers);

        // Load user votes
        const questionVote = this.currentUser ? await this.loadUserVote('question', this.question.id) : null;
        const answerVotesMap = this.currentUser ? await this.loadAnswerVotes(this.answers) : {};

        // Create question card
        const qCard = this.createQuestionCard(author, questionVote);
        this.container.appendChild(qCard);

        // Create answers section
        const answersSection = this.createAnswersSection(answerAuthorsMap, answerVotesMap);
        this.container.appendChild(answersSection);

        // Create answer form
        if (this.currentUser) {
            const answerForm = this.createAnswerForm();
            this.container.appendChild(answerForm);
        } else {
            this.container.appendChild(createElement('div', { 
                className: 'card',
                style: { textAlign: 'center', padding: '2rem' }
            }, 'لطفاً برای پاسخ دادن وارد شوید'));
        }
    }

    createQuestionCard(author, userVote) {
        const acceptedAnswer = this.answers.find(a => a.id === this.question.acceptedAnswerId);

        return createElement('div', { className: 'card' },
            createElement('div', { className: 'card-header' },
                createElement('div', { style: { flex: 1 } },
                    createElement('h1', { className: 'card-title' }, this.question.title),
                    createElement('div', { className: 'card-meta' },
                        createElement('span', {}, `نویسنده: ${author ? author.displayName : 'نامشخص'}`),
                        createElement('span', {}, formatDate(this.question.createdAt)),
                        this.question.department && createElement('span', {}, `دپارتمان: ${this.question.department}`),
                        createElement('span', { className: `priority-badge ${this.question.getPriorityClass()}` }, this.question.priority),
                        createElement('span', {}, `${this.question.views || 0} بازدید`)
                    )
                ),
                createVoteButtons(
                    this.question.id,
                    'question',
                    this.question.votesScore,
                    userVote,
                    (id, value) => this.handleQuestionVote(id, value)
                )
            ),
            createElement('div', { className: 'card-body' }, this.question.body),
            createElement('div', { className: 'card-footer' },
                createElement('div', { className: 'tags' },
                    ...this.question.tags.map(tag => createElement('span', { className: 'tag' }, tag))
                ),
                this.currentUser && this.currentUser.canEditQuestion(this.question) && createElement('div', { style: { display: 'flex', gap: '0.5rem' } },
                    createElement('button', {
                        className: 'btn btn-sm btn-outline',
                        onclick: () => {
                            window.location.hash = `#/questions/${this.question.id}/edit`;
                        }
                    }, 'ویرایش'),
                    createElement('button', {
                        className: 'btn btn-sm btn-danger',
                        onclick: () => {
                            if (confirm('آیا از حذف این سوال اطمینان دارید؟')) {
                                this.handleDelete();
                            }
                        }
                    }, 'حذف')
                )
            ),
            acceptedAnswer && createElement('div', {
                className: 'accepted-badge',
                style: { marginTop: '1rem', display: 'inline-block' }
            }, '✓ پاسخ پذیرفته شده')
        );
    }

    createAnswersSection(answerAuthorsMap, answerVotesMap) {
        const section = createElement('div', {},
            createElement('h2', { style: { marginBottom: '1rem' } }, `پاسخ‌ها (${this.answers.length})`)
        );

        if (this.answers.length === 0) {
            section.appendChild(createElement('div', { className: 'empty-state' }, 'هنوز پاسخی داده نشده است'));
        } else {
            // Sort: accepted first, then by votes
            const sortedAnswers = [...this.answers].sort((a, b) => {
                const aAccepted = a.id === this.question.acceptedAnswerId;
                const bAccepted = b.id === this.question.acceptedAnswerId;
                if (aAccepted && !bAccepted) return -1;
                if (!aAccepted && bAccepted) return 1;
                return b.votesScore - a.votesScore;
            });

            for (const answer of sortedAnswers) {
                const author = answerAuthorsMap[answer.authorId];
                const userVote = answerVotesMap[answer.id];
                const isAccepted = answer.id === this.question.acceptedAnswerId;
                
                const answerCard = createElement('div', {
                    className: 'card',
                    style: isAccepted ? { borderRight: '4px solid var(--success-color)' } : {}
                },
                    isAccepted && createElement('div', { className: 'accepted-badge' }, '✓ پاسخ پذیرفته شده'),
                    createElement('div', { className: 'card-header' },
                        createElement('div', { style: { flex: 1 } },
                            createElement('div', { className: 'card-meta' },
                                createElement('span', {}, `نویسنده: ${author ? author.displayName : 'نامشخص'}`),
                                createElement('span', {}, formatDate(answer.createdAt))
                            )
                        ),
                        createVoteButtons(
                            answer.id,
                            'answer',
                            answer.votesScore,
                            userVote,
                            (id, value) => this.handleAnswerVote(id, value)
                        )
                    ),
                    createElement('div', { className: 'card-body' }, answer.body),
                    createElement('div', { className: 'card-footer' },
                        this.currentUser && this.currentUser.canEditAnswer(answer) && createElement('div', { style: { display: 'flex', gap: '0.5rem' } },
                            createElement('button', {
                                className: 'btn btn-sm btn-outline',
                                onclick: () => {
                                    // Edit answer - simplified
                                    toast.info('ویرایش پاسخ در نسخه بعدی');
                                }
                            }, 'ویرایش'),
                            createElement('button', {
                                className: 'btn btn-sm btn-danger',
                                onclick: () => {
                                    if (confirm('آیا از حذف این پاسخ اطمینان دارید؟')) {
                                        this.handleDeleteAnswer(answer.id);
                                    }
                                }
                            }, 'حذف')
                        ),
                        this.currentUser && this.currentUser.canAcceptAnswer(this.question) && !isAccepted && createElement('button', {
                            className: 'btn btn-sm btn-success',
                            onclick: () => this.handleAcceptAnswer(answer.id)
                        }, 'پذیرفتن پاسخ')
                    )
                );
                section.appendChild(answerCard);
            }
        }

        return section;
    }

    createAnswerForm() {
        return createElement('div', { className: 'card', style: { marginTop: '2rem' } },
            createElement('h3', { style: { marginBottom: '1rem' } }, 'پاسخ خود را بنویسید'),
            createElement('form', {
                onsubmit: (e) => this.handleAnswerSubmit(e)
            },
                createElement('div', { className: 'form-group' },
                    createElement('label', { className: 'form-label', for: 'answerBody' }, 'پاسخ *'),
                    createElement('textarea', {
                        id: 'answerBody',
                        className: 'form-textarea',
                        required: true,
                        placeholder: 'پاسخ خود را وارد کنید',
                        'aria-label': 'متن پاسخ'
                    }),
                    createElement('div', { className: 'form-error', id: 'answerError' })
                ),
                createElement('button', {
                    type: 'submit',
                    className: 'btn btn-primary'
                }, 'ارسال پاسخ')
            )
        );
    }

    async loadAnswerAuthors(answers) {
        const authorIds = [...new Set(answers.map(a => a.authorId))];
        const authorsMap = {};
        
        for (const authorId of authorIds) {
            const result = await handleAsync(() => this.userService.getUserById(authorId));
            if (result.isOk() && result.data) {
                authorsMap[authorId] = result.data;
            }
        }
        
        return authorsMap;
    }

    async loadUserVote(targetType, targetId) {
        if (!this.currentUser) return null;
        
        const result = await handleAsync(() => 
            this.voteRepo.findByUserAndTarget(this.currentUser.id, targetType, targetId)
        );
        
        return result.isOk() ? result.data : null;
    }

    async loadAnswerVotes(answers) {
        if (!this.currentUser) return {};
        
        const votesMap = {};
        for (const answer of answers) {
            const vote = await this.loadUserVote('answer', answer.id);
            if (vote) {
                votesMap[answer.id] = vote;
            }
        }
        return votesMap;
    }

    async handleQuestionVote(questionId, value) {
        if (!this.currentUser) {
            toast.error('لطفاً ابتدا وارد شوید');
            return;
        }

        const result = await handleAsync(() => 
            this.questionService.voteOnQuestion(questionId, this.currentUser.id, value)
        );

        if (result.isOk()) {
            this.question = result.data;
            this.render(this.question.id);
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    async handleAnswerVote(answerId, value) {
        if (!this.currentUser) {
            toast.error('لطفاً ابتدا وارد شوید');
            return;
        }

        const result = await handleAsync(() => 
            this.answerService.voteOnAnswer(answerId, this.currentUser.id, value)
        );

        if (result.isOk()) {
            toast.info('رای شما ثبت شد');
            this.render(this.question.id);
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    async handleAnswerSubmit(e) {
        e.preventDefault();
        
        const body = $('#answerBody', this.container).value.trim();
        const errorEl = $('#answerError', this.container);
        if (errorEl) errorEl.textContent = '';

        const result = await handleAsync(() => 
            this.answerService.createAnswer({
                questionId: this.question.id,
                body
            }, this.currentUser.id)
        );

        if (result.isOk()) {
            toast.success('پاسخ با موفقیت ثبت شد');
            $('#answerBody', this.container).value = '';
            this.render(this.question.id);
        } else {
            if (result.error instanceof ValidationError) {
                if (errorEl) {
                    errorEl.textContent = result.error.message;
                } else {
                    toast.error(result.error.message);
                }
            } else {
                toast.error(getErrorMessage(result.error));
            }
        }
    }

    async handleAcceptAnswer(answerId) {
        const result = await handleAsync(() => 
            this.questionService.acceptAnswer(this.question.id, answerId)
        );

        if (result.isOk()) {
            this.question = result.data;
            toast.success('پاسخ به عنوان پاسخ پذیرفته شده انتخاب شد');
            this.render(this.question.id);
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    async handleDelete() {
        const result = await handleAsync(() => 
            this.questionService.deleteQuestion(this.question.id)
        );

        if (result.isOk()) {
            toast.success('سوال حذف شد');
            window.location.hash = '#/questions';
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }

    async handleDeleteAnswer(answerId) {
        const result = await handleAsync(() => 
            this.answerService.deleteAnswer(answerId)
        );

        if (result.isOk()) {
            toast.success('پاسخ حذف شد');
            this.render(this.question.id);
        } else {
            toast.error(getErrorMessage(result.error));
        }
    }
}
