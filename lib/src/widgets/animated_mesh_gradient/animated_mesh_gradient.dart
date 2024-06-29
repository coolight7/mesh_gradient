import 'package:flutter/material.dart';
import 'package:flutter_shaders/flutter_shaders.dart';
import 'package:mesh_gradient/src/widgets/animated_mesh_gradient/animated_mesh_gradient_options.dart';
import 'package:mesh_gradient/src/widgets/animated_mesh_gradient/animated_mesh_gradient_painter.dart';
import 'package:my_util_base/MyUtil.dart';

/// A widget that paints an animated mesh gradient.
///
/// This widget creates a visually appealing animated gradient effect by meshing together
/// four colors. It allows for customization through various parameters such as colors,
/// animation options, and a manual controller for animation control.
class AnimatedMeshGradient extends StatelessWidget {
  /// Path to the shader asset used for the gradient animation.
  static const String _shaderAssetPath =
      'packages/mesh_gradient/shaders/animated_mesh_gradient.frag';

  /// Creates a meshed gradient with provided colors and animates between them.
  ///
  /// The [colors] parameter must contain exactly four colors which will be used to
  /// create the animated gradient. The [options] parameter allows for customization
  /// of the animation effect. A [seed] can be provided to generate a static gradient
  /// based on the colors, effectively stopping the animation. The [controller] can be
  /// used for manual control over the animation. A [child] widget can be placed on top
  /// of the gradient.
  AnimatedMeshGradient({
    super.key,
    required this.colors,
    required this.options,
    required this.time,
    this.controller,
    this.child,
    this.seed,
  }) {
    assert(colors.length == 4);
    // Attempts to precache the shader used for the gradient animation.
    Future(() async {
      try {
        await ShaderBuilder.precacheShader(_shaderAssetPath);
      } catch (e) {
        debugPrint('[AnimatedMeshGradient] [Exception] Precaching Shader: $e');
        debugPrintStack(stackTrace: StackTrace.current);
      }
    });
  }

  final MyObj_c<double> time;

  /// Define 4 colors which will be used to create an animated gradient.
  final List<Color> colors;

  /// Here you can define options to play with the animation / effect.
  final AnimatedMeshGradientOptions options;

  /// Sets a seed for the mesh gradient which gives back a static blended gradient based on the given colors.
  /// This setting stops the animation. Try out different values until you like what you see.
  final double? seed;

  final AnimationController? controller;

  /// The child widget to display on top of the gradient.
  final Widget? child;

  Widget _buildPaint(
    FragmentShader shader,
    double time,
    Widget? child,
  ) {
    return CustomPaint(
      painter: AnimatedMeshGradientPainter(
        shader: shader,
        time: time * 10,
        colors: colors,
        options: options,
      ),
      willChange: true,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Builds the widget using a ShaderBuilder to apply the animated mesh gradient effect.
    return ShaderBuilder(
      assetKey: _shaderAssetPath,
      (context, shader, child) {
        if (null != controller) {
          return AnimatedBuilder(
            animation: controller!,
            builder: (_, child) {
              time.value += 0.01;
              return _buildPaint(
                shader,
                time.value,
                child,
              );
            },
            child: child,
          );
        }
        return _buildPaint(shader, seed ?? 0, child);
      },
      child: child,
    );
  }
}
