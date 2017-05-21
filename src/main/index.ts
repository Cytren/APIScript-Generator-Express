
import * as fs from "fs";
import * as del from "del";
import * as apiscript from "apiscript";

import {writeEntityClasses} from "./writer/entity-writer";
import {writeEnumClasses} from "./writer/enum-writer";
import {writeIndexClass} from "./writer/index-writer";

export class ExpressGenerator implements apiscript.Generator {

    generate(api: apiscript.API, config: apiscript.Config) {

        // get the build dirs from config if available
        let buildDir = config.buildDir ? config.buildDir : 'build';
        let libDir = buildDir + '/' + (config.libDir ? config.libDir : 'apiscript');
        let apiDir = buildDir + '/' + (config.apiDir ? config.apiDir : 'api');

        // remove old lib directory
        if (fs.existsSync(libDir)) { del.sync(libDir); }

        // write enums and entities
        writeEnumClasses(api, libDir);
        writeEntityClasses(api, libDir);

        // write index class
        writeIndexClass(api, libDir);

        console.log('\nGeneration complete!');
    }
}

let instance = new ExpressGenerator();
module.exports = instance;