import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    GrowthIndicator: GrowthIndicator;
    XAxisSettings: XAxisSettings;
    YAxisSettings: YAxisSettings;
    TooltipSettings: TooltipSettings;
    AnnotationSettings: AnnotationSettings;
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
export declare class AnnotationSettings {
    ToggleAnnotations: boolean;
    FontFamily: string;
    FontColor: string;
    FontSize: number;
    LineColor: string;
    LineThickness: number;
    LineStyle: string;
}
