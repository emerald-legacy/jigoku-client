import type { MenuItem } from "../types/game";

interface CardMenuProps {
    menu: MenuItem[];
    onMenuItemClick?: (menuItem: MenuItem) => void;
}

function CardMenu({ menu, onMenuItemClick }: CardMenuProps) {
    const handleMenuItemClick = (menuItem: MenuItem) => {
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
        <div className="panel menu">
            { menuItems }
        </div>
    );
}

CardMenu.displayName = "CardMenu";

export default CardMenu;
