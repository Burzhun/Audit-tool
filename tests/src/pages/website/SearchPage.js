import {CommonElementsAppPage} from "../CommonElementsAppPage";
import {By} from "selenium-webdriver";
import {DBFields} from "../../utils/db.params";
import {SearchFormTexts} from "../../utils/texts";

export class SearchPage extends CommonElementsAppPage {
    NUMBER_OF_RECORDS = By.xpath("//body/div[@id='root']/div/div[@class='container']/div[4]");
    TABLE_HEADERS = "thead.full-width > tr";
    RESULT_TABLE = By.xpath("//table[@class='ui celled fixed sortable striped table']");
    FOUND_RECORDS = "div[data-qa='show-all-records']";
    SEARCH_BTN = "button[data-qa='search-btn']";
    FILTER_REMOVE_BTN = "button[data-qa='filter-remove']";
    MINI_TABLE_ROW = By.xpath("//tr[@class='tableRow ']");
    TABLE_ROW_CLICKED = "tr.tableRow.clicked";
    ROWS_BEFORE_SELECTED = By.xpath("//tr[@class='tableRow clicked']/preceding-sibling::tr");
    PRE_LAST_PAGE_SEARCH_TABLE = "li:nth-last-child(2)";
    NEXT_LINK_SEARCH_TABLE = "li.next";
    SCORE_DROPDOWN = "div[data-qa='set-data'] > div[@class='ui selection dropdown']";
    ADD_NEW_RECORD = "button[data-qa=add-new-record]";
    ADD_PARAM_BTN = "button[data-qa=add-search-field]";
    DROPDOWN_INPUT = "div[role='combobox']";
    OPERATION_DROPDOWN = "div[data-qa=set-operation]";
    COLLECTION_DROPDOWN = "div[data-qa=collection-name]";
    FIELD_DROPDOWN = "div[data-qa=select-field]";
    FIELD_VALUE_INPUT = "input[data-qa=field-value]";
    FIELD_VALUE_DROPDOWN = "div[data-qa=field-val-dropdown]";
    ADD_COLUMN_DROPDOWN = "div[data-qa=add-field]";


    async removeBtnLocator(columnName) {
        return `th[data-qa='${columnName}'] div.remove_field_button`;
    }


    async setInputValue(placeholder, value, index = 0) {
        await this.typeText(`input[placeholder*='${placeholder}']`, value, index);
    };

    async selectRowById(record_id, name = DBFields.RECORD_ID) {
        await this.clickOnElement(By.xpath(`//td[@name='${name}-{record_id}']/parent::tr`));
    };

    async openScoreDropdown() {
        await this.clickOnElement(this.SCORE_DROPDOWN);
    };

    async selectDropdownInput(text, index = 0) {
        await this.clickOnElement(this.DROPDOWN_INPUT, index);
        await this.selectOptionByText(text);
    };

    async select_collection(collectionName) {
        await this.clickOnElement(this.COLLECTION_DROPDOWN);
        await this.selectOptionByText(collectionName);
    };

    async selectField(fieldName = DBFields.RECORD_ID, index = 0) {
        await this.clickOnElement(this.FIELD_DROPDOWN, index)
        await this.selectOptionByText(fieldName)
    };

    async selectOperation(operation = SearchFormTexts.EQUAL_TO, index = 0) {
        await this.clickOnElement(this.OPERATION_DROPDOWN, index);
        await this.selectOptionByText(operation);
    };

    async setFieldValue(fieldValue, index = 0, is_input = true) {
        if (is_input) {
            await this.typeText(this.FIELD_VALUE_INPUT, fieldValue, index)
        } else {
            await this.clickOnElement(this.FIELD_VALUE_DROPDOWN, index)
            await this.selectOptionByText(fieldValue);
        }
    };

    async addFieldDrop() {
        await this.clickOnElement(this.ADD_COLUMN_DROPDOWN);
    };

    async checkResultTableIsDisplayed() {
        return await this.checkElementPresentOrNot(this.RESULT_TABLE);
    };

    async addSearchParam(index) {
        await this.clickOnElement(this.ADD_PARAM_BTN, index);
        return await this.checkElementPresentOrNot(this.ADD_PARAM_BTN, index + 1);
    };

    async getCellValues(self, cellName) {
        return await this.getElText(`td[name*='${cellName}']`, null);
    };

    async getFoundRecordsText() {
        return await this.getElText(this.FOUND_RECORDS);
    };

    async searchInit() {
        await this.clickOnElement(this.SEARCH_BTN);
    };

    async removeFilterFromSearch(index) {
        await this.clickOnElement(this.FILTER_REMOVE_BTN, index);
    };

    async selectMiniTableRow(self, index) {
        await this.clickOnElement(this.MINI_TABLE_ROW, index);
    };

    async selectSelectedRowInMinTable(index) {
        await this.clickOnElement(this.TABLE_ROW_CLICKED, index);
    };

    async getSelectedRowCellValue(rowNumber, cellName) {
        return await this.getElText(By.xpath(`(//tr[@class='tableRow clicked'])[${rowNumber}]/td[contains(@name,'${cellName}')]`))
    };

    async checkTextPresentInRowCell(rowNumber, columnName, text) {
        return await this.waitForElementToContainText(By.xpath(`(//tr/td[contains(@name, '${columnName}')])[${rowNumber}]`), text);
    };

    async getRowCellValue(rowNumber, columnName) {
        return await this.getElText(By.xpath(`(//tr/td[contains(@name, '${columnName}')])[${rowNumber}]`));
    };

    async getSelectedRowsNumber() {
        return await this.countElements(this.TABLE_ROW_CLICKED);
    };

    async getNumberOfRowsBeforeSelected() {
        return await this.countElements(this.ROWS_BEFORE_SELECTED);
    };

    async getAllColumnValues(columnName) {
        return await this.getElText(`td[name*='${columnName}']`, null);
    };

    async checkNumberOfFoundRecordsInSearch(self, docs_number) {
        return docs_number !== 0 ? await this.waitElementToIncludeText() : await this.checkElementPresentOrNot(this.FOUND_RECORDS, false);
    };

    async checkMiniSearchFilterPresent(option, value) {
        return await this.checkElementPresentOrNot(By.xpath(`//span[@data-qa='${option}']//div[text()='${value}']`));
    };

    async checkMiniSearchFilterInputData(option, text, index = 0) {
        return await this.waitForElementToContainText(`span[data-qa='${option}'] input[placeholder='${option}']`, text, index);
    };

    async goToLastPage() {
        await this.clickOnElement(this.PRE_LAST_PAGE_SEARCH_TABLE)
        return await this.checkElementPresentOrNot(this.NEXT_LINK_SEARCH_TABLE, false);
    };

    async getLastPageNumber() {
        return parseInt(await this.getElText(this.PRE_LAST_PAGE_SEARCH_TABLE));
    };

    async searchInitByEnterBtn(placeholder = DBFields.RECORD_ID) {
        await this.enterBtnClick(`input[placeholder*='${placeholder}']`);
    };

    async removeColumn(columnName) {
        await this.clickOnElement(this.removeBtnLocator(columnName));
        return await this.checkElementPresentOrNot(this.removeBtnLocator(columnName));
    };

    async add_new_record(collectionName, displayed = true) {
        if (displayed) {
            await this.clickOnElement(this.ADD_NEW_RECORD);
            await this.switchToTab(1);
            return await this.waitForUrlContains(`${collectionName}/new/0`);
        } else {
            return await this.checkElementPresentOrNot(this.ADD_NEW_RECORD, false);
        }
    };

    async getInputFieldValue(index = 0) {
        return await this.getInputValues(this.FIELD_VALUE_INPUT, index);
    };

    async setSearchFilters(fieldName = DBFields.RECORD_ID, fieldValue = 1, operation = SearchFormTexts.EQUAL_TO,
                           secondFieldValue = null, index = 0, isFieldInput = true, fieldIndex = null) {
        const fieldIdx = fieldIndex === null ? index : fieldIndex;
        if (fieldName) {
            await this.selectField(fieldName, index);
        }

        if (operation) {
            await this.selectOperation(operation, index);
        }

        if (fieldValue) {
            await this.setFieldValue(fieldValue, fieldIdx, isFieldInput);
        }

        if (operation === SearchFormTexts.BETWEEN && secondFieldValue) {
            await this.setFieldValue(secondFieldValue, index + 1, isFieldInput);
        }
    };

    async addColumn(columnName) {
        await this.clickOnElement(this.ADD_COLUMN_DROPDOWN);
        await this.selectOptionByText(columnName)
        await this.addFieldBtnClick();
        return await this.checkElementPresentOrNot(this.removeBtnLocator(columnName))
    };

    async getAddColumnValues() {
        await this.clickOnElement(this.ADD_COLUMN_DROPDOWN);
        return await this.getOptionsList();
    };
}