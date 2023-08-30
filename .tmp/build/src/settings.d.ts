import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    LayoutSettings: LayoutSettings;
    XAxisSettings: XAxisSettings;
    YAxisSettings: YAxisSettings;
    LegendSettings: LegendSettings;
    TooltipSettings: TooltipSettings;
    PointLabels: PointLabels;
    GrowthIndicator: GrowthIndicator;
    PrimaryLabelSettings: PrimaryLabelSettings;
    SecondaryGrowthIndicator: SecondaryGrowthIndicator;
    SecondaryLabelSettings: SecondaryLabelSettings;
    AnnotationSettings: AnnotationSettings;
    LineSettings: LineSettings;
}
export declare class LayoutSettings {
    ChartTopMargin: number;
    ChartBottomMargin: number;
    ChartLeftMargin: number;
    ChartRightMargin: number;
    AxisColor: string;
    ToggleGridLines: string;
    GridlineColor: string;
}
export declare class LineSettings {
    LineColor: string;
    LineThickness: number;
}
export declare class XAxisSettings {
    FontFamily: string;
    FontColor: string;
    FontSize: number;
    TickCount: number;
    LabelAngle: number;
    XOffset: number;
    YOffset: number;
}
export declare class YAxisSettings {
    MinValue: number;
    MaxValue: number;
    DisplayUnits: string;
    DisplayDigits: number;
    TickCount: number;
    FontFamily: string;
    FontColor: string;
    FontSize: number;
}
export declare class LegendSettings {
    LegendToggle: boolean;
    LegendPosition: string;
    LegendMargin: number;
    FontColor: string;
    FontFamily: string;
    FontSize: number;
}
export declare class TooltipSettings {
    ToggleTooltip: boolean;
    TooltipColour: string;
    TextColour: string;
    TextSize: number;
}
export declare class PointLabels {
    TogglePointLabels: boolean;
    Frequency: string;
    nValue: number;
    Value: string;
    FontColor: string;
    FontFamily: string;
    FontSize: number;
    XOffset: number;
    YOffset: number;
}
export declare class GrowthIndicator {
    ToggleGrowthIndicator: boolean;
    Selector1: string;
    Selector2: string;
    LineColor: string;
    LineOffsetWidth: number;
    LineSize: number;
    ShowArrowLine: boolean;
    IncreasingColour: string;
    DecreasingColour: string;
    ShowArrow: boolean;
    ArrowSize: number;
}
export declare class PrimaryLabelSettings {
    ShowSign: boolean;
    FontColor: string;
    FontFamily: string;
    FontSize: number;
    LabelOffsetWidth: number;
    ToggleBgShape: boolean;
    LabelBackgroundColor: string;
    BorderColor: string;
    BorderSize: number;
    LabelHeight: number;
    LabelMinWidth: number;
    ToggleTextLabel: boolean;
    TextValue: string;
    AnnotationX: number;
    AnnotationY: number;
}
export declare class SecondaryGrowthIndicator {
    ToggleGrowthIndicator: boolean;
    Selector1: string;
    Selector2: string;
    LineColor: string;
    LineOffsetHeight: number;
    LineSize: number;
    DisplayArrow: string;
    ArrowSize: number;
    ArrowOffset: number;
}
export declare class SecondaryLabelSettings {
    Location: string;
    ShowSign: boolean;
    FontColor: string;
    FontFamily: string;
    FontSize: number;
    LabelOffsetHeight: number;
    ToggleBgShape: boolean;
    LabelBackgroundColor: string;
    BorderColor: string;
    BorderSize: number;
    LabelHeight: number;
    LabelMinWidth: number;
    ToggleTextLabel: boolean;
    TextValue: string;
    AnnotationX: number;
    AnnotationY: number;
}
export declare class AnnotationSettings {
    ToggleAnnotations: boolean;
    XOffset: number;
    YOffset: number;
    FontFamily: string;
    FontColor: string;
    FontSize: number;
    LineColor: string;
    LineThickness: number;
    LineStyle: string;
    ShowArrow: boolean;
    ArrowSize: number;
    SaveLocations: boolean;
}
