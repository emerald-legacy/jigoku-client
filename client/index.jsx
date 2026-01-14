/*global user, authToken */
import 'react-redux-toastr/src/styles/index.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import { navigate, login } from './actions';
import Application from './Application.jsx';
import 'bootstrap/dist/js/bootstrap';
import ReduxToastr from 'react-redux-toastr';
import ErrorBoundary from './SiteComponents/ErrorBoundary.jsx';

// Only import DevTools in development
let DevTools = null;
if (process.env.NODE_ENV !== 'production') {
    DevTools = require('./DevTools').default;
}

const store = configureStore();

store.dispatch(navigate(window.location.pathname, window.location.search));

window.onpopstate = function(e) {
    store.dispatch(navigate(e.target.location.pathname));
};

if (typeof user !== 'undefined') {
    store.dispatch(login(user, authToken, user.admin));
}

const render = () => {
    ReactDOM.render(
        <Provider store={store}>
            <div className='body'>
                <ReduxToastr
                    timeOut={4000}
                    newestOnTop
                    preventDuplicates
                    position='top-right'
                    transitionIn='fadeIn'
                    transitionOut='fadeOut' />
                <ErrorBoundary message={'We\'re sorry, a critical error has occurred in the client and we\'re unable to show you anything. Please try refreshing your browser after filling out a report.'}>
                    <Application />
                </ErrorBoundary>
                {DevTools && <DevTools />}
            </div>
        </Provider>,
        document.getElementById('component')
    );
};

// Hot module replacement for development
if (process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./Application.jsx', () => {
        setTimeout(render);
    });
}

render();
