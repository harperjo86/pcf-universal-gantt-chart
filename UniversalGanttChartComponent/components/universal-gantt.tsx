import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  Gantt,
  Task,
  EventOption,
  StylingOption,
  ViewMode,
  DisplayOption,
} from "gantt-task-react";
import { createHeaderLocal } from "./task-list-header";
import { ViewSwitcher } from "./view-switcher";
import { IInputs } from "../generated/ManifestTypes";
import { createTooltip } from "./gantt-tooltip";
import { createTaskListLocal } from "./task-list-table";
import { FilterHeader, FilterColumnInfo } from "./filter-header";
import { isErrorDialogOptions } from "../helper";

export type UniversalGanttProps = {
  context: ComponentFramework.Context<IInputs>;
  tasks: Task[];
  locale: string;
  recordDisplayName: string;
  startDisplayName: string;
  endDisplayName: string;
  progressDisplayName: string;
  startFieldName: string;
  endFieldName: string;
  progressFieldName: string;
  includeTime: boolean;
  isProgressing: boolean;
  crmUserTimeOffset: number;
  fontSize: string;
  ganttHeight?: number;
  rowHeight: number;
  headerHeight: number;
  listCellWidth: string;
  columnWidthQuarter: number;
  columnWidthHalf: number;
  columnWidthDay: number;
  columnWidthWeek: number;
  columnWidthMonth: number;
  additionalColumns?: { name: string; fieldName: string }[];
  filterColumns?: FilterColumnInfo[];
  onViewChange: (viewMode: ViewMode) => void;
  onExpanderStateChange: (itemId: string, expanderState: boolean) => void;
} & EventOption &
  DisplayOption;
export const UniversalGantt: React.FunctionComponent<UniversalGanttProps> = (
  props
) => {
  debugger;
  const [view, setView] = React.useState(props.viewMode);
  const [filteredTasks, setFilteredTasks] = React.useState<Task[]>(props.tasks);
  const [activeFilters, setActiveFilters] = React.useState<{ [fieldName: string]: string[] }>({});
  const { context } = props;

  // Sync parent tasks to local state whenever props change
  // This ensures updates from Dataverse (after refresh) update the local state
  React.useEffect(() => {
    // Re-apply filters when tasks are updated
    const hasActiveFilters = Object.values(activeFilters).some((vals) => vals && vals.length > 0);

    if (hasActiveFilters) {
      const filtered = props.tasks.filter((task) => {
        const record = context.parameters.entityDataSet.records[task.id];
        if (!record) return false;

        return Object.entries(activeFilters).every(([fieldName, filterValues]) => {
          if (!filterValues || filterValues.length === 0) return true;
          
          const recordValue = String(record.getValue(fieldName));
          return filterValues.some((val) => val === recordValue);
        });
      });
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(props.tasks);
    }
  }, [props.tasks]);

  // Handle filter changes with multi-select support
  // Logic: OR within each filter (show if ANY selected value matches), AND between filters (must match all active filters)
  const handleFilterChange = (filterValues: { [fieldName: string]: string[] }) => {
    setActiveFilters(filterValues);

    // Filter tasks based on selected filter values
    let filtered = props.tasks;
    const hasActiveFilters = Object.values(filterValues).some((vals) => vals && vals.length > 0);

    if (hasActiveFilters) {
      filtered = props.tasks.filter((task) => {
        const record = context.parameters.entityDataSet.records[task.id];
        if (!record) return false;

        // Check if record matches ALL active filters (AND logic between filters)
        // Within each filter, match ANY selected value (OR logic within filter)
        return Object.entries(filterValues).every(([fieldName, filterValues]) => {
          if (!filterValues || filterValues.length === 0) return true; // No filter active for this field
          
          const recordValue = String(record.getValue(fieldName));
          // Match if record value is in ANY of the selected values for this filter (OR logic)
          return filterValues.some((val) => val === recordValue);
        });
      });
    }

    setFilteredTasks(filtered);
  };

  // Events
  const handleDateChange = async (task: Task) => {
    const recordRef =
      context.parameters.entityDataSet.records[task.id].getNamedReference();
    const entityName =
      recordRef.etn || ((recordRef as any).logicalName as string);
    let resultState = true;
    try {
      await context.webAPI.updateRecord(entityName, task.id, {
        [props.endFieldName]: new Date(
          task.end.getTime() - props.crmUserTimeOffset * 60000
        ),
        [props.startFieldName]: new Date(
          task.start.getTime() - props.crmUserTimeOffset * 60000
        ),
      });
      // Update local state immediately for the dragged task
      setFilteredTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
      // Add a small delay to ensure Dataverse plugin changes complete before refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
      context.parameters.entityDataSet.refresh();
    } catch (e) {
      if (isErrorDialogOptions(e)) {
        context.navigation.openErrorDialog(e);
      } else {
        console.error(e);
      }
      resultState = false;
    }
    return resultState;
  };

  const handleProgressChange = async (task: Task) => {
    const recordRef =
      context.parameters.entityDataSet.records[task.id].getNamedReference();
    const entityName =
      recordRef.etn || ((recordRef as any).logicalName as string);
    let resultState = true;
    try {
      await context.webAPI.updateRecord(entityName, task.id, {
        [props.progressFieldName]: task.progress,
      });
      // Update local state immediately for the updated task
      setFilteredTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? task : t))
      );
      // Add a small delay to ensure Dataverse plugin changes complete before refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
      context.parameters.entityDataSet.refresh();
    } catch (e) {
      if (isErrorDialogOptions(e)) {
        context.navigation.openErrorDialog(e);
      } else {
        console.error(e);
      }
      resultState = false;
    }
    return resultState;
  };

  const handleOpenRecord = async (task: Task) => {
    const recordRef =
      context.parameters.entityDataSet.records[task.id].getNamedReference();
    context.parameters.entityDataSet.openDatasetItem(recordRef);
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    if (isSelected) {
      context.parameters.entityDataSet.setSelectedRecordIds([task.id]);
    } else {
      context.parameters.entityDataSet.clearSelectedRecordIds();
    }
  };

  const handleExpanderClick = (task: Task) => {
    props.onExpanderStateChange(task.id, !!task.hideChildren);
  };

  // Styling
  const formatDateShort = (value: Date, includeTime?: boolean) => {
    return context.formatting.formatDateShort(value, includeTime);
  };

  let options: StylingOption & EventOption = {
    fontSize: props.fontSize,
    fontFamily: "SegoeUI, Segoe UI",
    headerHeight: props.headerHeight,
    rowHeight: props.rowHeight,
    barCornerRadius: 0,
    listCellWidth: props.listCellWidth,
    TaskListHeader: createHeaderLocal(
      props.recordDisplayName,
      props.startDisplayName,
      props.endDisplayName,
      props.additionalColumns
    ),
    TooltipContent: createTooltip(
      props.startDisplayName,
      props.endDisplayName,
      props.progressDisplayName,
      context.resources.getString("Duration"),
      context.resources.getString("Duration_Metric"),
      props.includeTime,
      formatDateShort
    ),
    TaskListTable: createTaskListLocal(
      props.includeTime,
      handleOpenRecord,
      formatDateShort,
      props.context.parameters.entityDataSet,
      props.additionalColumns
    ),
  };

  switch (view) {
    case ViewMode.Month:
      options.columnWidth = props.columnWidthMonth;
      break;
    case ViewMode.Week:
      options.columnWidth = props.columnWidthWeek;
      break;
    case ViewMode.Day:
      options.columnWidth = props.columnWidthDay;
      break;
    case ViewMode.HalfDay:
      options.columnWidth = props.columnWidthHalf;
      break;
    default:
      options.columnWidth = props.columnWidthQuarter;
  }

  if (props.isProgressing) {
    options.onProgressChange = handleProgressChange;
  }

  return (
    <div className="Gantt-Wrapper">
      <FilterHeader
        filterColumns={props.filterColumns}
        onFilterChange={handleFilterChange}
      />
      <ViewSwitcher
        context={context}
        onViewChange={(viewMode) => {
          props.onViewChange(viewMode);
          setView(viewMode);
        }}
      />
      <Gantt
        {...props}
        {...options}
        tasks={filteredTasks}
        viewMode={view}
        onDoubleClick={handleOpenRecord}
        onDateChange={handleDateChange}
        onSelect={handleSelect}
        onExpanderClick={handleExpanderClick}
      />
    </div>
  );
};
