import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    GrowthIndicator: GrowthIndicator;
    SecondaryYAxis: SecondaryYAxis;
}
export declare class SecondaryYAxis {
    ToggleOn: boolean;
    MinValue: number;
    MaxValue: number;
    DisplayUnits: string;
    DisplayDigits: number;
    TickCount: number;
    FontFamily: string;
    FontColor: string;
    FontSize: number;
}
export declare class GrowthIndicator {
    ToggleGrowthIndicator: boolean;
    Selector1: string;
    Selector2: string;
}
