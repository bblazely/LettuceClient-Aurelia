import gulp from 'gulp';
import changedInPlace from 'gulp-changed-in-place';
import project from '../aurelia.json';
import rename from 'gulp-rename';
import {build} from 'aurelia-cli';

export default function processMarkup() {
  return gulp.src(project.markupProcessor.source)
    .pipe(changedInPlace({firstPass:true}))
    .pipe(rename(function(path) {
      if (path.dirname.endsWith(path.basename)) {
        path.dirname = path.dirname.substr(0, path.dirname.length - path.basename.length);
      }
      return path;
    }))
    .pipe(build.bundle());
}
