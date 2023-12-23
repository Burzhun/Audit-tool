import ast

import pytest

from conftest import doc_it
from dbutil.db_utils import update_mongo
from pages.charts.charts_page_actions import ChartsPage
from pages.search.search_page_actions import SearchPage
from pages.validation.validation_page_actions import ValidationPage
from params import db_params
from utils.app_actions import login_and_go_to_url


@pytest.mark.usefixtures("remove_files")
class TestCharts:
    @doc_it()
    @pytest.mark.color_palette
    def test_11735_color_palette(self, browser):
        """
        The user goes to the mini-search.
        Enters valid params for search and clicks on the rows.
        The user checks if legend is added to the chart according configuration.

        The user selects item once more and checks that no extra item appears on palette.
        The user clicks on remove btn and checks that item was removed
        """
        errors = []
        legend = {"Formatting": "provider_name.split(' ')[0] + ': ' + datetime_record_submitted_utc.slice(0,10);",
                  "Fields": [
                      "provider_name",
                      "client_type",
                      "currency_from",
                      "currency_to",
                      "datetime_record_submitted_utc"]}
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 7179
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"Charts.LegendLabelField": legend}})
        login_and_go_to_url(browser, collection_name, doc_id)

        search = SearchPage(browser)
        # remove last filter element and click on search
        search.remove_filter_from_search(-1)
        search.remove_filter_from_search(-1)
        search.search_init()
        # select first row:
        search.select_mini_table_row(0)
        provider_name = search.get_selected_row_cell_value(1, "provider_name")
        datetime_record_submitted_utc = search.get_selected_row_cell_value(1, "datetime_record_submitted_utc")
        formatted_text = f"""{provider_name.split(' ')[0] + ': ' + datetime_record_submitted_utc[:10]}"""
        # check that row is selected in the table:
        number_of_selected_rows = search.get_selected_rows_number()
        if number_of_selected_rows != 1:
            errors.append(f"expected number of selected rows 1, received: {number_of_selected_rows}")

        # check color:
        charts = ChartsPage(browser)
        first_row_palette = charts.get_palette_item(1)

        if first_row_palette.text[:first_row_palette.text.index('\n')] != formatted_text:
            errors.append(f"expected text for first row to be {formatted_text} but got {first_row_palette.text}")
        first_row_rgb = first_row_palette.value_of_css_property("background-color")
        r, g, b, alpha = ast.literal_eval(first_row_rgb.strip("rgba"))
        first_row_palette_color = '#%02x%02x%02x' % (r, g, b)
        if first_row_palette_color.upper() != '#FF6666':
            errors.append(f"expected color #FF6666 but got {first_row_palette_color}")
        number_on_the_palette = charts.get_number_of_items_on_palette()
        if number_on_the_palette != 1:
            errors.append(f"expected number of items on palette to be 1, got {number_on_the_palette}")
        # try to select once more the same row and check that number was not changed
        search.select_selected_row_in_min_table(0)
        number_on_the_palette_2 = charts.get_number_of_items_on_palette()
        if number_on_the_palette != number_on_the_palette_2:
            errors.append(
                f"expected number of items on palette not changed, was {number_on_the_palette}, now {number_on_the_palette_2}")
        # check that number of items in palette does not change
        # select second row and check:
        search.select_mini_table_row(0)
        second_row_provider = search.get_selected_row_cell_value(2, "provider_name")
        second_datetime_record_submitted_utc = search.get_selected_row_cell_value(2, "datetime_record_submitted_utc")
        # check color:
        charts = ChartsPage(browser)
        second_row_palette = charts.get_palette_item(2)
        second_row_formatted_text = f"{second_row_provider.split(' ')[0] + ': ' + second_datetime_record_submitted_utc[:10]}"
        if second_row_palette.text[:second_row_palette.text.index('\n')] != second_row_formatted_text:
            errors.append(
                f"expected text for second row to be {second_row_formatted_text} but got {second_row_palette.text}")
        second_row_rgb = second_row_palette.value_of_css_property("background-color")
        r, g, b, alpha = ast.literal_eval(second_row_rgb.strip("rgba"))
        second_row_palette_color = '#%02x%02x%02x' % (r, g, b)
        if second_row_palette_color.upper() != '#FFB266':
            errors.append(f"expected color #FFB266 but got {second_row_palette_color}")
        # remove first element from palette:
        charts.remove_palette_item(1)
        # check number of selected rows to be 1, check that selected is row number 2:
        number_of_selected_rows_after_remove = search.get_selected_rows_number()
        if number_of_selected_rows_after_remove != 1:
            errors.append(f"selection on row was not removed")
        # header is also a row, so 1 should be found
        number_of_rows_before_selected = search.get_number_of_rows_before_selected()
        if number_of_rows_before_selected != 1:
            errors.append(f"expected number of rows before selected 1 as header, got {number_of_rows_before_selected}")
        # check palette items number and color:
        number_on_the_palette_after_remove = charts.get_number_of_items_on_palette()
        if number_on_the_palette_after_remove != 1:
            errors.append(f"expected number of items on palette 1, got {number_on_the_palette_after_remove}")
        palette_item = charts.get_palette_item(1)
        palette_item_rgb = palette_item.value_of_css_property("background-color")
        r, g, b, alpha = ast.literal_eval(palette_item_rgb.strip("rgba"))
        palette_item_color = '#%02x%02x%02x' % (r, g, b)
        if palette_item_color.upper() != '#FF6666':
            errors.append(f"expected color #FF6666 but got {palette_item_color}")
        assert errors == []

    @doc_it()
    @pytest.mark.check_graph_point
    def test_11669_charting_capabilities(self, browser):
        """
        The user goes to the document with charts and clicks on the point on chart.
        Check that selected row is highlighted.
        The user selects second point on chart, check that first row is not highlighted any more and second row is highlighted.

        The user hovers on each of 2 points. Check that tooltip is visible and tooltip text is the same as selected columns
        for axises in the table.

        The user clicks on the first row and checks that first item is selected
        and first point is highlighted on chart.
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 7179
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        charts = ChartsPage(browser)
        charts.onclick_point_on_chart(0)
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(db_params.AMOUNTS_AND_RATES)
        row_0_classname = validation.get_class_of_low_level_table_row(row_ids[0])
        if "chart_selected_point" not in row_0_classname:
            errors.append(f"expected class chart_selected_point to be in first row, got {row_0_classname}")
        # user hovers on second point:
        point_tooltip = charts.get_point_tooltip(1).split('\n')
        x_axis_text = charts.get_axis_text('X')
        y_axis_text = charts.get_axis_text('Y')
        # check that second point has the same tooltip values as in table
        if x_axis_text not in point_tooltip[0]:
            errors.append(f"expected {x_axis_text} to be in tooltip, got {point_tooltip[0]}")
        else:
            x_text = point_tooltip[0][point_tooltip[0].index(x_axis_text) + len(x_axis_text) + 2:]
            cell_value_x = validation.get_cell_value_by_row_number_and_column_name(db_params.AMOUNTS_AND_RATES, 1,
                                                                                   x_axis_text)
            if x_text != cell_value_x:
                errors.append(f"In table value is: {cell_value_x} for {x_axis_text} column, but in tooltip: {x_text}")
        if y_axis_text not in point_tooltip[1]:
            errors.append(f"expected {x_axis_text} to be in tooltip, got {point_tooltip[1]}")
        else:
            y_text = point_tooltip[1][point_tooltip[1].index(y_axis_text) + len(y_axis_text) + 2:]
            cell_value_y = validation.get_cell_value_by_row_number_and_column_name(db_params.AMOUNTS_AND_RATES, 1,
                                                                                   y_axis_text)
            if y_text != cell_value_y:
                errors.append(f"In table value is: {cell_value_y} for {y_axis_text} column, but in tooltip: {y_text}")
        # user clicks on second point:
        charts.onclick_point_on_chart(1)
        row_1_classname = validation.get_class_of_low_level_table_row(row_ids[1])
        if "chart_selected_point" not in row_1_classname:
            errors.append(f"expected class chart_selected_point to be in second row, got {row_1_classname}")
        row_0_classname = validation.get_class_of_low_level_table_row(row_ids[0])
        if "chart_selected_point" in row_0_classname:
            errors.append(f"expected class chart_selected_point not to be in first row, got {row_0_classname}")
        # revert action, check on table
        row_ids = validation.get_all_ids_from_field_with_sub_ranges(db_params.AMOUNTS_AND_RATES)
        validation.select_sub_table_row_by_id(row_ids[0])
        # check that first point is highlighted
        first_point_cx = int(charts.get_selected_point_cx())
        if first_point_cx != 65:
            errors.append(f"expected first point cx to be 65, get {first_point_cx}")
        validation.select_sub_table_row_by_id(row_ids[1])
        second_point_cx = int(charts.get_selected_point_cx())
        if second_point_cx != 595:
            errors.append(f"expected first point cx to be 595, get {second_point_cx}")
        assert errors == []

    @doc_it()
    @pytest.mark.y_axis_check
    def test_12034_check_axis(self, browser):
        """
        The user selects a document and clicks on global updated to have
        boolean fields filled.
        Go to charts and check that on x axis no field amount_margin_approved.
        But on y_axis it is.
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        doc_id = 7179
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        # validation.global_updates()

        notification = 'Warning. This will trigger Global Updates on the entire dataset. Updates may take some time (up to minutes) to run.'
        validation.click_on_global_updates_button()
        alert_text = validation.get_alert_text()
        if notification not in alert_text:
            errors.append(f"Wrong notification is displayed when clicking on update button")
        validation.confirm_alert()
        exec_time_1 = validation.check_global_updates_validation()

        charts = ChartsPage(browser)
        charts.dropdown_axis_click(False)
        y_axis_options = charts.get_options_list()
        if "amount_margin_approved" in y_axis_options:
            errors.append(f"expected boolean fields not to be on Y axis")
        charts.dropdown_axis_click(True)
        x_axis_options = charts.get_options_list()
        if "amount_margin_approved" not in x_axis_options:
            errors.append(f"expected boolean fields to be on X axis")
        assert errors == []
