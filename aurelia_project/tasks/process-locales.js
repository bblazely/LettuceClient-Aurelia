import gulp from 'gulp';
import rename from 'gulp-rename';
import project from '../aurelia.json';

export default function processLocales() {
  return gulp.src(project.localesProcessor.source)
      .pipe(rename(function(path) {
        var parts = path.basename.split('.');
        path.dirname = parts[1] + '/';
        path.basename = parts[0];
        return path;
      }))
      .pipe(gulp.dest(project.localesProcessor.output));
};
