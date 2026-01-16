import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { format } from 'date-fns';

import AlertPanel from './SiteComponents/AlertPanel.jsx';
import TextArea from './FormComponents/TextArea.jsx';

import * as actions from './actions';

export function InnerNewsAdmin({ addNews, apiError, clearNewsStatus, loadNews, loading, news, newsSaved }) {
    const [newsText, setNewsText] = useState('');

    useEffect(() => {
        loadNews({ forceLoad: true });
    }, [loadNews]);

    useEffect(() => {
        if(newsSaved) {
            const timer = setTimeout(() => {
                clearNewsStatus();
            }, 5000);
            loadNews({ forceLoad: true });
            return () => clearTimeout(timer);
        }
    }, [newsSaved, clearNewsStatus, loadNews]);

    const onNewsTextChange = useCallback((event) => {
        setNewsText(event.target.value);
    }, []);

    const onAddNews = useCallback((event) => {
        event.preventDefault();
        addNews(newsText);
        setNewsText('');
    }, [addNews, newsText]);

    let content = null;

    const renderedNews = news?.map((newsItem, index) => (
        <tr key={ index }>
            <td>{ format(new Date(newsItem.datePublished), 'yyyy-MM-dd') }</td>
            <td>{ newsItem.poster }</td>
            <td>{ newsItem.text }</td>
        </tr>
    ));

    let successPanel = null;

    if(newsSaved) {
        successPanel = (
            <AlertPanel message='News added successfully' type='success' />
        );
    }

    if(loading) {
        content = <div>Loading news from the server...</div>;
    } else if(apiError) {
        content = <AlertPanel type='error' message={ apiError } />;
    } else {
        content = (
            <div>
                { successPanel }
                <table className='table table-striped'>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Poster</th>
                            <th>Text</th>
                        </tr>
                    </thead>
                    <tbody>
                        { renderedNews }
                    </tbody>
                </table>

                <form className='form'>
                    <TextArea name='newsText' label='Add news item' value={ newsText } onChange={ onNewsTextChange } />

                    <button type='submit' className='btn btn-primary' onClick={ onAddNews }>Add</button>
                </form>
            </div>
        );
    }

    return content;
}

InnerNewsAdmin.displayName = 'NewsAdmin';
InnerNewsAdmin.propTypes = {
    addNews: PropTypes.func,
    apiError: PropTypes.string,
    clearNewsStatus: PropTypes.func,
    loadNews: PropTypes.func,
    loading: PropTypes.bool,
    news: PropTypes.array,
    newsSaved: PropTypes.bool
};

function mapStateToProps(state) {
    return {
        apiError: state.api.message,
        loadNews: state.news.loadNews,
        loading: state.api.loading,
        news: state.news.news,
        newsSaved: state.news.newsSaved
    };
}

const NewsAdmin = connect(mapStateToProps, actions)(InnerNewsAdmin);

export default NewsAdmin;
