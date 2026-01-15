/*global user, authToken */
import 'react-redux-toastr/src/styles/index.scss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import { navigate, login } from './actions';
import Application from './Application.jsx';
import ReduxToastr from 'react-redux-toastr';
import ErrorBoundary from './SiteComponents/ErrorBoundary.jsx';

const store = configureStore();

store.dispatch(navigate(window.location.pathname, window.location.search));

window.onpopstate = function(e) {
    store.dispatch(navigate(e.target.location.pathname));
};

if(typeof user !== 'undefined') {
    store.dispatch(login(user, authToken, user.admin));
}

const container = document.getElementById('component');
const root = createRoot(container);

const render = () => {
    root.render(
        <Provider store={ store }>
            <div className='body'>
                <ReduxToastr
                    timeOut={ 4000 }
                    newestOnTop
                    preventDuplicates
                    position='top-right'
                    transitionIn='fadeIn'
                    transitionOut='fadeOut' />
                <ErrorBoundary message={ 'We\'re sorry, a critical error has occurred in the client and we\'re unable to show you anything. Please try refreshing your browser after filling out a report.' }>
                    <Application />
                </ErrorBoundary>
            </div>
        </Provider>
    );
};

// Hot module replacement for development
if(process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./Application.jsx', () => {
        setTimeout(render);
    });
}

render();
