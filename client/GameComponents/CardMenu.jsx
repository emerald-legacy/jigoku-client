import PropTypes from 'prop-types';

function CardMenu({ menu, onMenuItemClick }) {
    const handleMenuItemClick = (menuItem) => {
        if(onMenuItemClick) {
            onMenuItemClick(menuItem);
        }
    };

    const menuItems = menu.map((menuItem, index) => (
        <div key={ index } onClick={ () => handleMenuItemClick(menuItem) }>
            { menuItem.text }
        </div>
    ));

    return (
        <div className='panel menu'>
            { menuItems }
        </div>
    );
}

CardMenu.displayName = 'CardMenu';
CardMenu.propTypes = {
    menu: PropTypes.array.isRequired,
    onMenuItemClick: PropTypes.func
};

export default CardMenu;
