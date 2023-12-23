import {CommonElementsAppPage} from "../CommonElementsAppPage";
import {By} from 'selenium-webdriver';

export class ChartsPage extends CommonElementsAppPage {
    PALETTE_ITEM = "div.mini_search_selected_record";
    PALETTE_REMOVE_BTN = "span.selected_record_mini_remove";
    GRAPH_POINT = By.xpath("//*[local-name()='svg']//*[local-name()='g' and @class='recharts-layer recharts-scatter-symbol']");
    POINT_TOOLTIP = "div.recharts-tooltip-wrapper"
    RED_POINT = By.xpath(
        "//*[local-name()='svg']//*[local-name()='g' and @class='recharts-layer recharts-reference-dot']/*[local-name()='circle']");
    X_AXIS_SELECTION = By.xpath("//span[contains(text(),'Select X Axis')]//div[@class='text']");
    Y_AXIS_SELECTION = By.xpath("(//span[contains(text(),'Select Y Axis')]/following-sibling::div[@role='listbox']/div)[1]");
    Y_AXIS_DROPDOWN = By.xpath("//span[text()='Select Y Axis']/following-sibling::div[1]");
    X_AXIS_DROPDOWN = By.xpath("//span[contains(text(),'Select X Axis')]/div");

    async get_palette_item_backGround(index) {
        return await this.getStyles(this.PALETTE_ITEM, 'background-color', index);
    };

    async get_number_of_items_on_palette() {
        return await this.countElements(this.PALETTE_REMOVE_BTN);
    };

    async remove_palette_item(index) {
        await this.clickOnElement(this.PALETTE_REMOVE_BTN, index)
    };

    async onclick_point_on_chart(index) {
        await this.clickOnElement(this.GRAPH_POINT, index);
    };

    async get_point_tooltip(index) {
        await this.elementHover(this.GRAPH_POINT, index);
        return await this.getElText(this.POINT_TOOLTIP);
    };

    async get_selected_point_cx(self) {
        return await this.getElementAttribute(this.RED_POINT, "cx");
    };

    async get_axis_text(xAxis = true) {
        const locator = xAxis ? this.X_AXIS_SELECTION : this.Y_AXIS_SELECTION;
        return await this.getElText(locator);
    };

    async dropdown_axis_click(self, xAxis) {
        const locator = xAxis ? this.X_AXIS_DROPDOWN : this.Y_AXIS_DROPDOWN;
        await this.clickOnElement(locator);
    }
}