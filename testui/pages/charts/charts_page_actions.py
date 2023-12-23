from pages.base.common_elements_actions import CommonElementsPage
from pages.charts.charts_page_locators import ChartsPageLocators


class ChartsPage(CommonElementsPage):
    def get_palette_item(self, index):
        # 0 - is current index
        return self.find_elements(ChartsPageLocators.PALETTE_ITEM)[index]

    def get_number_of_items_on_palette(self):
        return len(self.find_elements(ChartsPageLocators.PALETTE_REMOVE_BTN))

    def remove_palette_item(self, index):
        self.click_on_element(ChartsPageLocators.PALETTE_REMOVE_BTN, index)

    def onclick_point_on_chart(self, index):
        self.click_on_element(ChartsPageLocators.GRAPH_POINT, index)

    def get_point_tooltip(self, index):
        el = self.find_elements(ChartsPageLocators.GRAPH_POINT)[index]
        self.on_hover_element(el)
        return self.get_el_text(ChartsPageLocators.POINT_TOOLTIP)

    def get_selected_point_cx(self):
        return self.get_element_attribute(ChartsPageLocators.RED_POINT, "cx")

    def get_axis_text(self, axis):
        if axis.upper() == 'X':
            return self.get_el_text(ChartsPageLocators.X_AXIS_SELECTION)
        elif axis.upper() == 'Y':
            return self.get_el_text(ChartsPageLocators.Y_AXIS_SELECTION)
        else:
            return ValueError

    def dropdown_axis_click(self, x_axis):
        if x_axis:
            el = ChartsPageLocators.X_AXIS_DROPDOWN
        else:
            el = ChartsPageLocators.Y_AXIS_DROPDOWN
        self.click_on_element(el)
