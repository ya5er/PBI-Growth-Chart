import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    LayoutSettings: LayoutSettings;
    XAxisSettings: XAxisSettings;
    YAxisSettings: YAxisSettings;
    TooltipSettings: TooltipSettings;
    PointLabels: PointLabels;
    GrowthIndicator: GrowthIndicator;
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
export declare class TooltipSettings {
    ToggleTooltip: boolean;
    TooltipColour: string;
    TextColour: string;
    TextSize: number;
}
export declare class PointLabels {
    TogglePointLabels: boolean;
    Frequency: string;
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
    IncreasingColour: string;
    DecreasingColour: string;
    ShowArrow: boolean;
    ArrowSize: number;
}
export declare class SecondaryGrowthIndicator {
    ToggleGrowthIndicator: boolean;
    Selector1: string;
    Selector2: string;
}
export declare class SecondaryLabelSettings {
    Location: string;
    LabelBackgroundColor: string;
    FontColor: string;
    FontFamily: string;
    FontSize: number;
    BorderColor: string;
    BorderSize: number;
    LabelOffsetHeight: number;
    LabelHeight: number;
    LabelMinWidth: number;
    ShowSign: boolean;
    ToggleBgShape: boolean;
}
export declare class AnnotationSettings {
    ToggleAnnotations: boolean;
    FontFamily: string;
    FontColor: string;
    FontSize: number;
    LineColor: string;
    LineThickness: number;
    LineStyle: string;
    ShowArrow: boolean;
    ArrowSize: number;
}
